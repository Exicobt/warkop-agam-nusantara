import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import {
  HttpError,
  readJson,
  toCleanString,
  toPositiveInt,
} from "@/lib/validation";

const MAX_LINES = 50;
const MAX_QTY = 99;

/** Gabungkan baris duplikat & validasi { id, qty, type }. */
function parseLines(orders) {
  if (!Array.isArray(orders) || orders.length === 0 || orders.length > MAX_LINES) {
    throw new HttpError(400, "Pesanan kosong atau terlalu banyak item.");
  }
  const merged = new Map();
  for (const o of orders) {
    const type = o?.type === "combo" ? "combo" : "menu";
    const id = toPositiveInt(o?.id);
    const qty = toPositiveInt(o?.qty, MAX_QTY);
    if (!id || !qty) throw new HttpError(400, "Item pesanan tidak valid.");
    const key = `${type}:${id}`;
    const prev = merged.get(key);
    const total = (prev?.qty ?? 0) + qty;
    if (total > MAX_QTY) throw new HttpError(400, `Maksimal ${MAX_QTY} porsi per item.`);
    merged.set(key, { type, id, qty: total });
  }
  return [...merged.values()];
}

/** Bagi harga kombo ke tiap item sebanding harga satuannya (selisih pembulatan ke item pertama). */
function splitComboPrice(comboTotal, items) {
  const sum = items.reduce((s, i) => s + i.harga, 0);
  const shares = items.map((i) =>
    sum > 0 ? Math.floor((comboTotal * i.harga) / sum) : Math.floor(comboTotal / items.length)
  );
  shares[0] += comboTotal - shares.reduce((s, v) => s + v, 0);
  return shares;
}

export async function POST(request) {
  try {
    const body = await readJson(request);
    const token = typeof body.token === "string" && body.token ? body.token : null;

    // Tanpa QR token = pesanan dibuat staf (walk-in) -> wajib login kasir/admin.
    if (!token) {
      const auth = await requireRole(request, ["kasir", "admin"]);
      if (auth.error) return auth.error;
    }

    const lines = parseLines(body.orders);

    // Metode pembayaran (opsional, tapi bila dikirim harus valid)
    let paymentMethodId = null;
    if (body.payment_method_id !== undefined && body.payment_method_id !== null && body.payment_method_id !== "") {
      paymentMethodId = toPositiveInt(body.payment_method_id);
      const exists = paymentMethodId
        ? await prisma.payment_method.findUnique({ where: { id: paymentMethodId } })
        : null;
      if (!exists) throw new HttpError(400, "Metode pembayaran tidak valid.");
    }

    // Harga SELALU dihitung di server dari database.
    const menuIds = lines.filter((l) => l.type === "menu").map((l) => l.id);
    const comboIds = lines.filter((l) => l.type === "combo").map((l) => l.id);

    const [menus, combos] = await Promise.all([
      menuIds.length
        ? prisma.menu.findMany({ where: { id: { in: menuIds } }, select: { id: true, harga: true } })
        : [],
      comboIds.length
        ? prisma.combo.findMany({
            where: { id: { in: comboIds } },
            include: { items: { include: { menu: { select: { id: true, harga: true } } } } },
          })
        : [],
    ]);
    const menuMap = new Map(menus.map((m) => [m.id, m]));
    const comboMap = new Map(combos.map((c) => [c.id, c]));

    const orderRows = [];
    let total = 0;

    for (const line of lines) {
      if (line.type === "menu") {
        const menu = menuMap.get(line.id);
        if (!menu) throw new HttpError(400, "Ada menu yang sudah tidak tersedia. Muat ulang halaman.");
        const lineTotal = menu.harga * line.qty;
        orderRows.push({ menu_id: menu.id, qty: line.qty, total: lineTotal });
        total += lineTotal;
      } else {
        const combo = comboMap.get(line.id);
        if (!combo || combo.items.length === 0) {
          throw new HttpError(400, "Ada kombo yang sudah tidak tersedia. Muat ulang halaman.");
        }
        const comboTotal = combo.price * line.qty;
        const shares = splitComboPrice(
          comboTotal,
          combo.items.map((i) => ({ menu_id: i.menu_id, harga: i.menu.harga }))
        );
        combo.items.forEach((item, idx) => {
          orderRows.push({ menu_id: item.menu_id, qty: line.qty, total: shares[idx] });
        });
        total += comboTotal;
      }
    }

    const basket = await prisma.$transaction(async (tx) => {
      let tableRecord = null;
      let customerName;
      let tipeOrder;

      if (token) {
        // Klaim token secara atomik: hanya satu request yang bisa memakainya.
        const session = await tx.tableSessions.findFirst({
          where: { token, status: "active", expired_at: { gt: new Date() } },
          include: { table: true },
        });
        if (!session) throw new HttpError(400, "QR code sudah tidak valid atau kedaluwarsa.");
        if (!session.table || session.table.status !== "available") {
          throw new HttpError(400, "Meja tidak tersedia atau sedang digunakan.");
        }
        const claimed = await tx.tableSessions.updateMany({
          where: { token, status: "active" },
          data: { status: "used" },
        });
        if (claimed.count !== 1) throw new HttpError(409, "QR code baru saja dipakai.");

        tableRecord = session.table;
        customerName = `Meja ${session.table.table_number}`;
        tipeOrder = "dine_in";
      } else {
        tipeOrder = body.tipe_order === "dine_in" ? "dine_in" : "take_away";
        customerName = toCleanString(body.name) || "Walk-in";

        if (tipeOrder === "dine_in") {
          const tableNumber = toCleanString(String(body.table ?? ""), 10);
          tableRecord = tableNumber
            ? await tx.table.findUnique({ where: { table_number: tableNumber } })
            : null;
          if (!tableRecord || tableRecord.status !== "available") {
            throw new HttpError(400, "Meja tidak tersedia atau sedang digunakan.");
          }
        }
      }

      const customer = await tx.customers.create({
        data: {
          name: customerName,
          ...(tableRecord ? { table: { connect: { id: tableRecord.id } } } : {}),
        },
      });

      const created = await tx.basket.create({
        data: {
          customers_id: customer.id,
          status: "pending",
          total,
          tipe_order: tipeOrder,
          payment_method_id: paymentMethodId,
          orders: { create: orderRows },
        },
        select: { id: true, status: true, total: true, tipe_order: true },
      });

      if (token) {
        await tx.tableSessions.update({ where: { token }, data: { order_id: created.id } });
      }
      return created;
    });

    return NextResponse.json(basket, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message, message: err.message }, { status: err.status });
    }
    console.error("POST /api/cart:", err);
    return NextResponse.json({ error: "Gagal membuat pesanan", message: "Gagal membuat pesanan" }, { status: 500 });
  }
}
