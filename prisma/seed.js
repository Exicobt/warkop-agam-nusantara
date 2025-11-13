const { PrismaClient } = require("@prisma/client");
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
      { table_number: "1", status: "available", location: "lantai_1" },
      { table_number: "2", status: "available", location: "lantai_1" },
      { table_number: "3", status: "available", location: "lantai_1" },
      { table_number: "4", status: "available", location: "lantai_2" },
      { table_number: "5", status: "available", location: "lantai_2" },
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
