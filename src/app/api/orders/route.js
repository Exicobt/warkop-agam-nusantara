import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, withSessionRefresh } from "@/lib/api-auth";
import { transitionOrder } from "@/lib/order-status";
import {
  ORDER_STATUSES,
  readJson,
  toPositiveInt,
} from "@/lib/validation";

const ACTIVE_STATUSES = ["waiting", "preparing", "done"];
const MAX_ROWS = 500;
const MAX_ROWS_WITH_RANGE = 5000;

// Staf (admin/kasir/dapur).
//   ?status=all|pending|waiting|preparing|done|finish|cancelled  (tanpa parameter = pesanan aktif)
//   ?from=<tanggal ISO>  hanya pesanan sejak tanggal tsb (untuk laporan; batas baris lebih besar)
//   ?to=<tanggal ISO>    hanya pesanan sampai tanggal tsb (dipakai bersama `from`)
export async function GET(req) {
  const auth = await requireRole(req, ["admin", "kasir", "dapur"]);
  if (auth.error) return auth.error;

  const params = new URL(req.url).searchParams;
  const filterStatus = params.get("status");
  const fromParam = params.get("from");
  const from = fromParam ? new Date(fromParam) : null;
  if (from && Number.isNaN(from.getTime())) {
    return NextResponse.json({ error: "Parameter from tidak valid" }, { status: 400 });
  }
  const toParam = params.get("to");
  const to = toParam ? new Date(toParam) : null;
  if (to && Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Parameter to tidak valid" }, { status: 400 });
  }

  let where;
  if (!filterStatus) {
    where = { status: { in: ACTIVE_STATUSES } };
  } else if (filterStatus === "all") {
    where = {};
  } else if (ORDER_STATUSES.includes(filterStatus)) {
    where = { status: filterStatus };
  } else {
    return NextResponse.json({ error: "Filter status tidak valid" }, { status: 400 });
  }

  if (from || to) {
    where = {
      ...where,
      create_at: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) },
    };
  }

  try {
    const orders = await prisma.basket.findMany({
      where,
      take: from || to ? MAX_ROWS_WITH_RANGE : MAX_ROWS,
      orderBy: { create_at: "desc" },
      include: {
        customers: { include: { table: true } },
        // `gambar` (base64) sengaja tidak diambil: payload polling jadi jauh lebih kecil.
        orders: {
          include: {
            menu: { select: { id: true, nama: true, harga: true, kategori: true } },
          },
        },
        payment_method: true,
      },
    });

    const response = NextResponse.json(
      orders.map((order) => ({
        id: order.id,
        create_at: order.create_at,
        status: order.status,
        tipe_order: order.tipe_order,
        customers: order.customers,
        total: order.total ?? order.orders.reduce((s, o) => s + o.total, 0),
        orders: order.orders.map((item) => ({
          id: item.id,
          qty: item.qty,
          total: item.total,
          menu: item.menu,
        })),
        payment_method: order.payment_method,
      }))
    );
    return await withSessionRefresh(response, auth.session);
  } catch (error) {
    console.error("GET /api/orders:", error);
    return NextResponse.json({ error: "Gagal mengambil data pesanan" }, { status: 500 });
  }
}

// Ubah status pesanan. Aturan transisi & efek ke meja/statistik ada di lib/order-status.
export async function POST(req) {
  const auth = await requireRole(req, ["admin", "kasir", "dapur"]);
  if (auth.error) return auth.error;

  try {
    const { basket_id, status } = await readJson(req);
    const id = toPositiveInt(basket_id);

    if (!id || !ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: "basket_id atau status tidak valid" }, { status: 400 });
    }

    const result = await transitionOrder(id, status, auth.session.role);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, message: result.error }, { status: result.status });
    }
    return NextResponse.json(result.basket);
  } catch (err) {
    console.error("POST /api/orders:", err);
    return NextResponse.json({ error: "Gagal update status order" }, { status: 500 });
  }
}
