import { NextResponse } from "next/server";
import { AUTH_COOKIE, homePathForRole, verifyToken } from "@/lib/auth";

// Next.js 16: `middleware` berganti nama menjadi `proxy`.
// Halaman staf dilindungi berdasarkan role pada JWT yang DITANDATANGANI server.
const ROLE_ROUTES = {
  admin: "/dashboard",
  kasir: "/cashier",
  dapur: "/dapur",
};

const matchesRoute = (pathname, route) =>
  pathname === route || pathname.startsWith(`${route}/`);

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const session = await verifyToken(request.cookies.get(AUTH_COOKIE)?.value);

  for (const [role, route] of Object.entries(ROLE_ROUTES)) {
    if (!matchesRoute(pathname, route)) continue;

    if (!session) {
      const response = NextResponse.redirect(new URL("/", request.url));
      // Buang cookie rusak/kedaluwarsa bila ada
      if (request.cookies.has(AUTH_COOKIE)) response.cookies.delete(AUTH_COOKIE);
      return response;
    }
    if (session.role !== role) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    return NextResponse.next();
  }

  // Sudah login & membuka halaman login -> arahkan ke panel sesuai role
  if (pathname === "/" && session) {
    return NextResponse.redirect(new URL(homePathForRole(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/dapur/:path*", "/cashier/:path*"],
};
