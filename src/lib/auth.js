import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE = "token";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 jam, detik
export const ROLES = ["admin", "kasir", "dapur"];

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET belum diset atau terlalu pendek (minimal 32 karakter). Lihat .env.example."
    );
  }
  return new TextEncoder().encode(secret);
}

/** Buat JWT bertanda tangan untuk sesi login. */
export async function generateToken(user) {
  return await new SignJWT({
    id: user.id,
    nama: user.full_name || user.email || "",
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.uid))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/** Verifikasi JWT. Mengembalikan payload, atau null jika tidak valid/kedaluwarsa. */
export async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (!ROLES.includes(payload.role)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function homePathForRole(role) {
  if (role === "admin") return "/dashboard";
  if (role === "kasir") return "/cashier";
  if (role === "dapur") return "/dapur";
  return "/";
}
