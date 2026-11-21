import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Publik: dipanggil halaman pelanggan untuk memeriksa QR meja.
// QR permanen — valid selama token masih milik sebuah meja yang aktif.
export async function GET(request) {
  try {
    const token = new URL(request.url).searchParams.get("token");

    if (!token || token.length > 100) {
      return NextResponse.json({ valid: false, error: "QR code tidak ditemukan" });
    }

    const table = await prisma.table.findFirst({ where: { qr_token: token } });

    if (!table) {
      return NextResponse.json({
        valid: false,
        error: "QR code tidak dikenali atau sudah diganti. Minta kasir untuk QR terbaru.",
      });
    }

    if (table.status === "not_available") {
      return NextResponse.json({ valid: false, error: "Meja sedang tidak tersedia" });
    }

    return NextResponse.json({
      valid: true,
      table_number: table.table_number,
      session_id: String(table.id),
    });
  } catch (error) {
    console.error("Error validating QR:", error);
    return NextResponse.json({ valid: false, error: "Terjadi kesalahan validasi" }, { status: 500 });
  }
}
