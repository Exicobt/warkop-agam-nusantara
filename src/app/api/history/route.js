import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

const MAX_ROWS = 1000;

export async function GET(request) {
  const auth = await requireRole(request, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const history = await prisma.basket.findMany({
      take: MAX_ROWS,
      orderBy: { create_at: "desc" },
      include: {
        orders: {
          include: { menu: { select: { nama: true, harga: true, kategori: true } } },
        },
        customers: {
          select: { name: true, table: { select: { table_number: true } } },
        },
      },
    });

    return NextResponse.json(
      history.map((basket) => ({
        id: basket.id,
        created_at: basket.create_at,
        customer_name: basket.customers?.name || "Guest",
        table_number: basket.customers?.table?.table_number || "-",
        status: basket.status,
        items: basket.orders.map((order) => ({
          menu_name: order.menu?.nama || "Item dihapus",
          qty: order.qty,
          price: order.menu?.harga || 0,
          total: order.total,
        })),
        total_price:
          basket.total ?? basket.orders.reduce((sum, order) => sum + order.total, 0),
      }))
    );
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Gagal mengambil history" }, { status: 500 });
  }
}
