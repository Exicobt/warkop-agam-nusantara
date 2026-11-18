import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

// Admin: reset seluruh menu. Urutan hapus mengikuti ketergantungan foreign key
// (kombo -> item kombo -> statistik -> baris pesanan -> menu).
export async function POST(request) {
  const auth = await requireRole(request, ["admin"]);
  if (auth.error) return auth.error;

  try {
    await prisma.$transaction([
      prisma.comboItem.deleteMany(),
      prisma.combo.deleteMany(),
      prisma.menu_stats.deleteMany(),
      prisma.website_order.deleteMany(),
      prisma.orders.deleteMany(),
      prisma.menu.deleteMany(),
    ]);

    return NextResponse.json({ message: "Semua data menu berhasil dihapus" });
  } catch (error) {
    console.error("Error saat reset menu:", error);
    return NextResponse.json({ error: "Gagal mereset menu" }, { status: 500 });
  }
}
