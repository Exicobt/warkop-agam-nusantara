const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");

  await prisma.payment_method.createMany({
    data: [{ name: "Cash" }, { name: "QRIS" }, { name: "Debit Card" }],
    skipDuplicates: true,
  });

  await prisma.order_type.createMany({
    data: [{ name: "Dine In" }, { name: "Take Away" }],
    skipDuplicates: true,
  });

  await prisma.table.createMany({
    data: [
      { table_number: "1", status: "available"},
      { table_number: "2", status: "available"},
      { table_number: "3", status: "available"},
      { table_number: "4", status: "available"},
      { table_number: "5", status: "available"},
    ],
    skipDuplicates: true,
  });

  await prisma.menu.createMany({
    data: [
      { nama: "Nasi Goreng", harga: 25000, kategori: "foods", gambar: "" },
      { nama: "Mie Goreng", harga: 22000, kategori: "foods", gambar: "" },
      { nama: "Ayam Bakar", harga: 35000, kategori: "foods", gambar: "" },
      { nama: "Sate Ayam", harga: 28000, kategori: "foods", gambar: "" },
      { nama: "Kopi Hitam", harga: 10000, kategori: "drinks", gambar: "" },
      { nama: "Es Teh", harga: 8000, kategori: "drinks", gambar: "" },
      {
        nama: "Jus Alpukat",
        harga: 15000,
        kategori: "drinks",
        gambar: "",
      },
      {
        nama: "Kentang Goreng",
        harga: 18000,
        kategori: "snacks",
        gambar: "",
      },
      { nama: "Roti Bakar", harga: 16000, kategori: "snacks", gambar: "" },
      {
        nama: "Pisang Goreng",
        harga: 12000,
        kategori: "snacks",
        gambar: "",
      },
    ],
    skipDuplicates: true,
  });

  // Menambahkan user untuk ketiga role
  await prisma.admin_account.createMany({
    data: [
      {
        email: "dapur@gmail.com",
        full_name: "Dapur User",
        role: "dapur",
        uid: "PQPbM3XRG2W59FiYug0pXE4zQS52"
      },
      {
        email: "kasir@gmail.com",
        full_name: "Kasir User",
        role: "kasir",
        uid : "Dp2tj6jHFlSE4Micm50w5GPHB3p2"
      },
      {
        email: "admin@gmail.com",
        full_name: "Admin User",
        role: "admin",
        uid: "gwpHZFPDZ3X6D5OfAz4D4DTD6Cz1"
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
