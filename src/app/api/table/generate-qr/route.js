import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { readJson, toPositiveInt } from "@/lib/validation";

/**
 * QR meja bersifat PERMANEN: satu token tetap per meja (kolom table.qr_token),
 * dicetak sekali dan ditempel di meja. Token hanya diganti bila admin
 * meminta `regenerate: true` (mis. QR bocor/disalahgunakan) — QR cetak lama
 * otomatis tidak berlaku setelah itu.
 */
export async function POST(request) {
  const auth = await requireRole(request, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const body = await readJson(request);
    const tableId = toPositiveInt(body.table_id);
    if (!tableId) {
      return NextResponse.json({ error: "table_id wajib diisi" }, { status: 400 });
    }

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      return NextResponse.json({ error: "Meja tidak ditemukan" }, { status: 404 });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
    const regenerate = body.regenerate === true;

    let token = table.qr_token;
    let reused = true;
    if (!token || regenerate) {
      token = randomBytes(24).toString("base64url"); // 32 karakter, tidak bisa ditebak
      reused = false;
      await prisma.table.update({
        where: { id: table.id },
        data: { qr_token: token, qr_generated_at: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      reused,
      qr_url: `${baseUrl}/kasir/${token}`,
      table_number: table.table_number,
    });
  } catch (error) {
    console.error("generate-qr:", error);
    return NextResponse.json({ error: "Gagal generate QR code" }, { status: 500 });
  }
}
