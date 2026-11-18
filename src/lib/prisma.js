import { PrismaClient } from "@prisma/client";

// Satu instance PrismaClient untuk seluruh aplikasi (hindari kehabisan koneksi
// MySQL akibat banyak `new PrismaClient()` di tiap route / hot reload).
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
