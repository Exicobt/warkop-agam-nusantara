import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import {
  MENU_CATEGORIES,
  isValidImage,
  prismaErrorStatus,
  readJson,
  toCleanString,
  toPositiveInt,
} from "@/lib/validation";

// Publik: dipakai halaman pemesanan pelanggan (QR) dan kasir.
export async function GET() {
  try {
    const menus = await prisma.menu.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json(menus);
  } catch (err) {
    console.error("GET /api/menu:", err);
    return NextResponse.json({ error: "Gagal mengambil menu" }, { status: 500 });
  }
}

function parseMenuInput(body) {
  const nama = toCleanString(body.nama);
  const harga = toPositiveInt(body.harga, 100_000_000);
  const kategori = MENU_CATEGORIES.includes(body.kategori) ? body.kategori : null;
  const gambar = isValidImage(body.gambar) ? body.gambar : null;

  const errors = {};
  if (!nama) errors.nama = "Nama menu wajib diisi (maks. 255 karakter)";
  if (!harga) errors.harga = "Harga harus berupa bilangan bulat positif";
  if (!kategori) errors.kategori = "Kategori tidak valid";
  if (!gambar) errors.gambar = "Gambar tidak valid atau terlalu besar";

  return { data: { nama, harga, kategori, gambar }, errors };
}

// Admin: tambah / ubah menu (dibedakan lewat field `action`, kompatibel dengan UI lama).
export async function POST(req) {
  const auth = await requireRole(req, ["admin"]);
  if (auth.error) return auth.error;

  const body = await readJson(req);
  const { data, errors } = parseMenuInput(body);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: Object.values(errors)[0], errors },
      { status: 400 }
    );
  }

  try {
    if (body.action === "update") {
      const id = toPositiveInt(body.menu_id);
      if (!id) {
        return NextResponse.json({ error: "menu_id tidak valid" }, { status: 400 });
      }
      const updated = await prisma.menu.update({ where: { id }, data });
      return NextResponse.json(updated);
    }

    if (body.action === "create") {
      const created = await prisma.menu.create({ data });
      return NextResponse.json(created, { status: 201 });
    }

    return NextResponse.json({ error: "action tidak dikenal" }, { status: 400 });
  } catch (err) {
    const mapped = prismaErrorStatus(err);
    if (mapped) return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    console.error("POST /api/menu:", err);
    return NextResponse.json({ error: "Gagal menyimpan menu" }, { status: 500 });
  }
}

// Admin: hapus satu menu.
export async function DELETE(req) {
  const auth = await requireRole(req, ["admin"]);
  if (auth.error) return auth.error;

  const { menu_id } = await readJson(req);
  const id = toPositiveInt(menu_id);
  if (!id) {
    return NextResponse.json({ error: "menu_id tidak valid" }, { status: 400 });
  }

  try {
    const [orderCount, comboCount] = await Promise.all([
      prisma.orders.count({ where: { menu_id: id } }),
      prisma.comboItem.count({ where: { menu_id: id } }),
    ]);

    if (orderCount > 0) {
      return NextResponse.json(
        { error: "Menu tidak bisa dihapus karena sudah ada di riwayat pesanan." },
        { status: 409 }
      );
    }
    if (comboCount > 0) {
      return NextResponse.json(
        { error: "Menu tidak bisa dihapus karena dipakai di kombo menu. Hapus/ubah kombonya dulu." },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.menu_stats.deleteMany({ where: { menu_id: id } }),
      prisma.website_order.deleteMany({ where: { menu_id: id } }),
      prisma.menu.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Menu berhasil dihapus" });
  } catch (err) {
    const mapped = prismaErrorStatus(err);
    if (mapped) return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    console.error("DELETE /api/menu:", err);
    return NextResponse.json({ error: "Gagal menghapus menu" }, { status: 500 });
  }
}
