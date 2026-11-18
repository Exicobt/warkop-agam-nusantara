import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { readJson, toPositiveInt } from "@/lib/validation";

const SESSION_HOURS = 4;

export async function POST(request) {
  const auth = await requireRole(request, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(request);
    const tableId = toPositiveInt(body.table_id);
    if (!tableId) {
      return NextResponse.json({ error: "table_id wajib diisi" }, { status: 400 });
    }

    // Nomor meja diambil dari database, bukan dari klien.
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      return NextResponse.json({ error: "Meja tidak ditemukan" }, { status: 404 });
    }

    const token = randomUUID();
    const expired_at = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");

    const [, session] = await prisma.$transaction([
      // Nonaktifkan QR lama milik meja ini
      prisma.tableSessions.updateMany({
        where: { table_number: table.table_number, status: "active" },
        data: { status: "expired" },
      }),
      prisma.tableSessions.create({
        data: { table_number: table.table_number, token, status: "active", expired_at },
      }),
      prisma.table.update({
        where: { id: table.id },
        data: { qr_generated_at: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      qr_url: `${baseUrl}/kasir/${token}`,
      token,
      session_id: session.id,
      expires_at: expired_at,
    });
  } catch (error) {
    console.error("generate-qr:", error);
    return NextResponse.json({ error: "Gagal generate QR code" }, { status: 500 });
  }
}
