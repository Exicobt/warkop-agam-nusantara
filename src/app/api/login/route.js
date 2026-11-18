import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { AUTH_COOKIE, generateToken, sessionCookieOptions } from "@/lib/auth";
import { readJson } from "@/lib/validation";

export async function POST(req) {
  try {
    const { idToken } = await readJson(req);

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Data login tidak lengkap" }, { status: 400 });
    }

    // Verifikasi ID token Firebase di server — uid/email dari klien TIDAK dipercaya.
    let decoded;
    try {
      decoded = await getAdminAuth().verifyIdToken(idToken);
    } catch (err) {
      if (typeof err?.code === "string" && err.code.startsWith("auth/")) {
        return NextResponse.json(
          { error: "Sesi Firebase tidak valid. Silakan login ulang." },
          { status: 401 }
        );
      }
      throw err; // misal kredensial admin belum dikonfigurasi -> 500
    }

    const user = await prisma.admin_account.findFirst({
      where: { uid: decoded.uid },
    });

    if (!user || !user.role) {
      return NextResponse.json(
        { error: "Akun belum terdaftar sebagai staf." },
        { status: 403 }
      );
    }

    const token = await generateToken(user);
    const response = NextResponse.json({ message: "Login berhasil", role: user.role });
    response.cookies.set(AUTH_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
