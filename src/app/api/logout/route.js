import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logout success" },
    { status: 200 }
  );

  // Hapus cookie token
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,        // KUNCI UTAMA: hapus cookie
    path: "/",
    sameSite: "strict",
  });

  return response;
}
