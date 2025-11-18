import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(request, { params }) {
  // Await params karena di Next.js 15 params itu kadang dianggap promise
  const { id } = await params;
  const orderId = parseInt(id);

  try {
    // 1. Cek dulu statusnya sekarang apa
    const currentOrder = await prisma.basket.findUnique({
      where: { id: orderId },
    });

    if (!currentOrder) {
      return NextResponse.json({ message: "Order tidak ditemukan" }, { status: 404 });
    }

    // 2. Validasi: Cuma boleh cancel kalau status masih 'waiting'
    if (currentOrder.status !== "waiting") {
      return NextResponse.json({ message: "Ups! Pesanan sudah diproses dapur, tidak bisa dibatalkan." }, { status: 400 });
    }

    // 3. Eksekusi Update Status jadi 'cancelled'
    // Pastikan di schema.prisma enum kitchen_status ada 'cancelled' ya!
    // Kalau belum ada, update schema.prisma kamu dulu, terus 'npx prisma db push'
    // Kalau belum ada, kita anggap kamu sudah nambahin enum 'cancelled'

    /* NOTE: Kalau di schema.prisma kamu belum ada enum 'cancelled', 
       kamu harus tambah dulu:
       enum kitchen_status {
         waiting
         preparing
         done
         finish
         cancelled  <-- TAMBAH INI
       }
    */

    const updatedOrder = await prisma.basket.update({
      where: { id: orderId },
      data: { status: "cancelled" }, // Pastikan enum ini ada di database
    });

    return NextResponse.json({ message: "Pesanan berhasil dibatalkan", data: updatedOrder });
  } catch (error) {
    console.error("Gagal cancel order:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
