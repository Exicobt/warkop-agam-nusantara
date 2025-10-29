import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()


export async function POST() {
    try {
        await prisma.$transaction([
            prisma.menu_stats.deleteMany(),
            prisma.website_order.deleteMany(),
            prisma.orders.deleteMany(),
            prisma.menu.deleteMany(),
        ]);

        return NextResponse.json({ meesage: "semua data berhasil dihapus" }, { status: 200 })
    }
    catch (error) {
        console.error('Error saat hapus data:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}