import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET(request) {
  const auth = await requireRole(request, ["admin"]);
  if (auth.error) return auth.error;

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100);
  if (!query) return NextResponse.json({ menus: [], orders: [] });

  try {
    const [menus, orders] = await Promise.all([
      prisma.menu.findMany({
        where: { nama: { contains: query, mode: "insensitive" } },
        take: 5,
      }),
      prisma.basket.findMany({
        where: { customers: { name: { contains: query, mode: "insensitive" } } },
        include: { customers: true, orders: true },
        take: 5,
        orderBy: { create_at: "desc" },
      }),
    ]);

    return NextResponse.json({ menus, orders });
  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ error: "Gagal mencari data" }, { status: 500 });
  }
}
