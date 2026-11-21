import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  AUTH_COOKIE,
  SESSION_ABSOLUTE_MAX_AGE,
  SESSION_MAX_AGE,
  generateToken,
  sessionCookieOptions,
  verifyToken,
} from "@/lib/auth";

/**
 * Ambil sesi dari cookie request. Return payload JWT atau null.
 */
export async function getSession(request) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  return await verifyToken(token);
}

/**
 * Guard untuk route handler.
 *
 *   const auth = await requireRole(request, ["admin"]);
 *   if (auth.error) return auth.error;
 *   const { session } = auth;
 */
export async function requireRole(request, roles) {
  const session = await getSession(request);
  if (!session) {
    return {
      error: NextResponse.json(
        { error: "Sesi tidak valid. Silakan login kembali." },
        { status: 401 }
      ),
    };
  }
  if (roles && !roles.includes(session.role)) {
    return {
      error: NextResponse.json(
        { error: "Anda tidak memiliki izin untuk aksi ini." },
        { status: 403 }
      ),
    };
  }
  return { session };
}

/**
 * Sesi geser (sliding session): layar dapur/kasir biasanya dibiarkan menyala
 * seharian dan terus polling. Tanpa perpanjangan, cookie 8 jam habis diam-diam
 * lalu semua aksi (mis. update status pesanan) gagal dengan 401.
 *
 * Bila sisa umur sesi < setengah masa berlaku, terbitkan cookie baru — selama
 * akun masih terdaftar dan sesi awal belum melewati batas mutlak.
 * Gagal memperpanjang tidak pernah menggagalkan respons utama.
 */
export async function withSessionRefresh(response, session) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const remaining = (session.exp ?? 0) - now;
    if (remaining > SESSION_MAX_AGE / 2) return response;
    if (now - (session.iat ?? now) > SESSION_ABSOLUTE_MAX_AGE) return response;

    const user = await prisma.admin_account.findFirst({ where: { uid: String(session.sub) } });
    if (!user || !user.role) return response;

    const token = await generateToken(user);
    response.cookies.set(AUTH_COOKIE, token, sessionCookieOptions());
  } catch (error) {
    console.error("Gagal memperpanjang sesi:", error);
  }
  return response;
}
