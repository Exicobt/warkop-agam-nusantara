import { NextResponse } from "next/server";
import { AUTH_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logout berhasil" });
  response.cookies.set(AUTH_COOKIE, "", sessionCookieOptions(0));
  return response;
}
