import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const paymentMethods = await prisma.payment_method.findMany();
    return NextResponse.json(paymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
