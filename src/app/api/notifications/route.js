import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

const TIME_ZONE = process.env.APP_TIMEZONE || "Asia/Jakarta";

const formatTime = (date) =>
  new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });

const include = { customers: { include: { table: true } } };

export async function GET(request) {
  const auth = await requireRole(request, ["admin"]);
  if (auth.error) return auth.error;

  try {
    const [newOrders, cancelledOrders] = await Promise.all([
      prisma.basket.findMany({
        where: { status: "waiting" },
        include,
        orderBy: { create_at: "desc" },
        take: 5,
      }),
      prisma.basket.findMany({
        where: { status: "cancelled" },
        include,
        orderBy: { create_at: "desc" },
        take: 3,
      }),
    ]);

    const notifications = [
      ...newOrders.map((order) => ({
        id: `ord-${order.id}`,
        type: "info",
        title: "Pesanan Masuk",
        message: order.customers?.table?.table_number
          ? `Meja ${order.customers.table.table_number} (${order.customers.name}) baru pesan!`
          : `${order.customers?.name || "Guest"} baru pesan!`,
        time: formatTime(order.create_at),
        read: false,
        timestamp: new Date(order.create_at).getTime(),
      })),
      ...cancelledOrders.map((order) => ({
        id: `cncl-${order.id}`,
        type: "warning",
        title: "Pesanan Dibatalkan",
        message: `Order #${order.id} dibatalkan.`,
        time: formatTime(order.create_at),
        read: false,
        timestamp: new Date(order.create_at).getTime(),
      })),
    ].sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Notif Error:", error);
    return NextResponse.json({ error: "Gagal ambil notif" }, { status: 500 });
  }
}
