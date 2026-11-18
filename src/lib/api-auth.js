import { NextResponse } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

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
