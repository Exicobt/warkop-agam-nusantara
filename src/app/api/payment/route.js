// src/app/api/payment/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Ambil data dari tabel Payment_method
    // Perhatikan: Di schema.prisma nama modelnya "Payment_method",
    // jadi di prisma client biasanya dipanggil "payment_method" (camelCase)
    const methods = await prisma.payment_method.findMany();

    // 2. Return data sesuai format yang diminta frontend kamu
    // Frontend minta: { paymentMethods: [...] }
    return NextResponse.json({
      paymentMethods: methods,
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json({ message: "Gagal mengambil data pembayaran" }, { status: 500 });
  }
}
