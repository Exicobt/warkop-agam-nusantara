import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Publik: dipanggil halaman pelanggan untuk memeriksa QR token.
export async function GET(request) {
  try {
    const token = new URL(request.url).searchParams.get("token");

    if (!token || token.length > 100) {
      return NextResponse.json({ valid: false, error: "Token tidak ditemukan" });
    }

    const session = await prisma.tableSessions.findFirst({
      where: { token, status: "active" },
      include: { table: true },
    });

    if (!session) {
      return NextResponse.json({
        valid: false,
        error: "QR code tidak ditemukan atau sudah digunakan",
      });
    }

    if (session.expired_at && session.expired_at.getTime() <= Date.now()) {
      return NextResponse.json({ valid: false, error: "QR code sudah kedaluwarsa" });
    }

    if (!session.table || session.table.status !== "available") {
      return NextResponse.json({ valid: false, error: "Meja sedang tidak tersedia" });
    }

    return NextResponse.json({
      valid: true,
      table_number: session.table_number,
      session_id: session.id,
    });
  } catch (error) {
    console.error("Error validating session:", error);
    return NextResponse.json({ valid: false, error: "Terjadi kesalahan validasi" }, { status: 500 });
  }
}
