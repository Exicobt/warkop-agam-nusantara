import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    // Kita cari data secara PARALEL (Menu & Pelanggan) biar ngebut
    // 1. Cari di Menu (berdasarkan nama)
    const menus = await prisma.menu.findMany({
      where: {
        nama: {
          contains: query,
          // mode: 'insensitive' // Hapus ini kalau error di MySQL, MySQL defaultnya udah insensitive
        },
      },
      take: 5, // Batasi 5 aja biar gak menuhin layar
    });

    // 2. Cari di Order/Customer (berdasarkan nama pelanggan)
    // Kita cari di tabel Basket yang punya relasi ke Customers
    const orders = await prisma.basket.findMany({
      where: {
        customers: {
          name: {
            contains: query,
          },
        },
      },
      include: {
        customers: true,
        orders: true, // Biar tau total harganya
      },
      take: 5,
      orderBy: {
        create_at: "desc",
      },
    });

    // Gabungkan hasilnya jadi satu format JSON
    return NextResponse.json({
      menus,
      orders,
    });
  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ error: "Gagal mencari data" }, { status: 500 });
  }
}
