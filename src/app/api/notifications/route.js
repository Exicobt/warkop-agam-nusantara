import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Ambil Pesanan yang statusnya 'waiting' (Pesanan Baru)
    // Kita anggap ini notif "Info"
    const newOrders = await prisma.basket.findMany({
      where: {
        status: "waiting",
      },
      include: {
        customers: true,
      },
      orderBy: {
        create_at: "desc",
      },
      take: 5, // Ambil 5 terbaru aja
    });

    // 2. Ambil Pesanan yang statusnya 'cancelled' (Masalah)
    // Kita anggap ini notif "Warning"
    const cancelledOrders = await prisma.basket.findMany({
      where: {
        status: "cancelled",
      },
      include: {
        customers: true,
      },
      orderBy: {
        create_at: "desc",
      },
      take: 3,
    });

    // 3. Mapping data dari Database ke Format Notifikasi Frontend
    const notifData = [
      ...newOrders.map((order) => ({
        id: `ord-${order.id}`,
        type: "info",
        title: "Pesanan Masuk",
        message: `Meja ${order.customers?.table_id || "?"} (${order.customers?.name || "Guest"}) baru pesan!`,
        time: new Date(order.create_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        read: false, // Di real app, status read ini harusnya disimpen di DB juga
        timestamp: new Date(order.create_at).getTime(),
      })),
      ...cancelledOrders.map((order) => ({
        id: `cncl-${order.id}`,
        type: "warning",
        title: "Pesanan Dibatalkan",
        message: `Order #${order.id} dibatalkan. Cek alasannya!`,
        time: new Date(order.create_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        read: false,
        timestamp: new Date(order.create_at).getTime(),
      })),
    ];

    // Urutkan biar yang paling baru di atas
    notifData.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json(notifData);
  } catch (error) {
    console.error("Notif Error:", error);
    return NextResponse.json({ error: "Gagal ambil notif" }, { status: 500 });
  }
}
