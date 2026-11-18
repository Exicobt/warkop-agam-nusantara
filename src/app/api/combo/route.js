import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import {
  prismaErrorStatus,
  readJson,
  toCleanString,
  toPositiveInt,
} from "@/lib/validation";

// Gambar menu (base64) sengaja tidak ikut: hanya nama/harga yang dibutuhkan UI kombo.
const comboInclude = {
  items: {
    include: {
      menu: { select: { id: true, nama: true, harga: true, kategori: true } },
    },
  },
};

/** Validasi & normalisasi { name, price, items } -> data atau pesan error. */
async function parseCombo(body) {
  const name = toCleanString(body.name);
  const price = toPositiveInt(body.price, 100_000_000);
  const items = Array.isArray(body.items)
    ? body.items.map((v) => toPositiveInt(v))
    : [];

  if (!name) return { error: "Nama kombo wajib diisi" };
  if (!price) return { error: "Harga kombo harus berupa bilangan bulat positif" };
  if (items.length < 2 || items.length > 20 || items.some((v) => !v)) {
    return { error: "Kombo harus berisi 2–20 menu yang valid" };
  }

  const uniqueIds = [...new Set(items)];
  const found = await prisma.menu.count({ where: { id: { in: uniqueIds } } });
  if (found !== uniqueIds.length) {
    return { error: "Ada menu dalam kombo yang tidak ditemukan" };
  }

  return { data: { name, price, items } };
}

// Publik: ditampilkan di halaman pemesanan.
export async function GET() {
  try {
    const combos = await prisma.combo.findMany({
      include: comboInclude,
      orderBy: { id: "desc" },
    });
    return NextResponse.json(combos);
  } catch (error) {
    console.error("GET /api/combo:", error);
    return NextResponse.json({ error: "Gagal mengambil data kombo menu" }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireRole(request, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const parsed = await parseCombo(await readJson(request));
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const { name, price, items } = parsed.data;
    const created = await prisma.combo.create({
      data: { name, price, items: { create: items.map((menu_id) => ({ menu_id })) } },
      include: comboInclude,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/combo:", error);
    return NextResponse.json({ error: "Gagal membuat kombo menu" }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await requireRole(request, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(request);
    const id = toPositiveInt(body.id);
    if (!id) return NextResponse.json({ error: "id kombo tidak valid" }, { status: 400 });

    const parsed = await parseCombo(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const { name, price, items } = parsed.data;

    // Hapus item lama + update dalam satu transaksi agar tidak ada kombo "kosong".
    const [, updated] = await prisma.$transaction([
      prisma.comboItem.deleteMany({ where: { combo_id: id } }),
      prisma.combo.update({
        where: { id },
        data: { name, price, items: { create: items.map((menu_id) => ({ menu_id })) } },
        include: comboInclude,
      }),
    ]);
    return NextResponse.json(updated);
  } catch (error) {
    const mapped = prismaErrorStatus(error);
    if (mapped) return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    console.error("PUT /api/combo:", error);
    return NextResponse.json({ error: "Gagal mengupdate kombo menu" }, { status: 500 });
  }
}

// Dengan body { id } menghapus satu kombo; tanpa body menghapus semua kombo.
export async function DELETE(request) {
  const auth = await requireRole(request, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(request);

    if (body.id !== undefined && body.id !== null) {
      const id = toPositiveInt(body.id);
      if (!id) return NextResponse.json({ error: "id kombo tidak valid" }, { status: 400 });

      await prisma.$transaction([
        prisma.comboItem.deleteMany({ where: { combo_id: id } }),
        prisma.combo.delete({ where: { id } }),
      ]);
      return NextResponse.json({ message: "Kombo menu berhasil dihapus" });
    }

    await prisma.$transaction([prisma.comboItem.deleteMany(), prisma.combo.deleteMany()]);
    return NextResponse.json({ message: "Semua kombo menu berhasil dihapus" });
  } catch (error) {
    const mapped = prismaErrorStatus(error);
    if (mapped) return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    console.error("DELETE /api/combo:", error);
    return NextResponse.json({ error: "Gagal menghapus kombo menu" }, { status: 500 });
  }
}
