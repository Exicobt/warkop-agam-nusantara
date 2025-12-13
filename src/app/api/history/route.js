import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    // Mengambil semua basket dengan relasi orders, customers, dan order_type
    const history = await prisma.basket.findMany({
      include: {
        orders: {
          include: {
            menu: {
              select: {
                nama: true,
                harga: true,
                kategori: true,
              },
            },
          },
        },
        customers: {
          select: {
            name: true,
            table: {
              select: {
                table_number: true,
              },
            },
          },
        },
      },
      orderBy: {
        create_at: "desc",
      },
    });

    // Format data untuk frontend
    const formattedHistory = history.map((basket) => ({
      id: basket.id,
      created_at: basket.create_at,
      customer_name: basket.customers?.name || "Guest",
      table_number: basket.customers?.table?.table_number || "-",
      status: basket.status,
      items: basket.orders.map((order) => ({
        menu_name: order.menu?.nama || "Unknown Item",
        qty: order.qty,
        price: order.menu?.harga || 0,
        total: order.total,
      })),
      total_price: basket.orders.reduce((sum, order) => sum + order.total, 0),
    }));

    return Response.json(formattedHistory, { status: 200 });
  } catch (error) {
    console.error("Error fetching history:", error);
    return Response.json({ error: "Gagal mengambil history" }, { status: 500 });
  }
}
