import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { uid, email } = await req.json();

    if (!uid || !email) {
      return NextResponse.json({ error: "Data login tidak lengkap" }, { status: 400 });
    }

    const user = await prisma.admin_account.findFirst({ where: { uid } });

    if (!user) {
      return NextResponse.json({ error: "Email tidak terdaftar" }, { status: 403 });
    }

    // SIMPLIFIED: set cookie berisi role + uid
    const response = NextResponse.json(
      { message: "Login berhasil", role: user.role },
      { status: 200 }
    );
    
    response.cookies.set('token', JSON.stringify({
      uid: user.uid,
      role: user.role
    }), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
