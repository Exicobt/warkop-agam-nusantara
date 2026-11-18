import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Publik: daftar metode pembayaran untuk halaman pemesanan.
export async function GET() {
  try {
    const methods = await prisma.payment_method.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json({ paymentMethods: methods });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json({ message: "Gagal mengambil data pembayaran" }, { status: 500 });
  }
}
