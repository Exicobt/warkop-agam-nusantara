const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Gambar placeholder (host sudah diizinkan di next.config.mjs).
const placeholder = (text) =>
  `https://placehold.co/600x400.png?text=${encodeURIComponent(text)}`;

const menus = [
  { nama: "Nasi Goreng", harga: 25000, kategori: "foods" },
  { nama: "Mie Goreng", harga: 22000, kategori: "foods" },
  { nama: "Ayam Bakar", harga: 35000, kategori: "foods" },
  { nama: "Sate Ayam", harga: 28000, kategori: "foods" },
  { nama: "Kopi Hitam", harga: 10000, kategori: "drinks" },
  { nama: "Es Teh", harga: 8000, kategori: "drinks" },
  { nama: "Jus Alpukat", harga: 15000, kategori: "drinks" },
  { nama: "Kentang Goreng", harga: 18000, kategori: "snacks" },
  { nama: "Roti Bakar", harga: 16000, kategori: "snacks" },
  { nama: "Pisang Goreng", harga: 12000, kategori: "snacks" },
].map((m) => ({ ...m, gambar: placeholder(m.nama) }));

// UID = UID user di Firebase Authentication project Anda.
// Bisa diisi lewat .env (SEED_*_UID); nilai di bawah hanya cadangan.
const staff = [
  {
    email: "dapur@gmail.com",
    full_name: "Dapur User",
    role: "dapur",
    uid: process.env.SEED_DAPUR_UID || "PQPbM3XRG2W59FiYug0pXE4zQS52",
  },
  {
    email: "kasir@gmail.com",
    full_name: "Kasir User",
    role: "kasir",
    uid: process.env.SEED_KASIR_UID || "Dp2tj6jHFlSE4Micm50w5GPHB3p2",
  },
  {
    email: "admin@gmail.com",
    full_name: "Admin User",
    role: "admin",
    uid: process.env.SEED_ADMIN_UID || "gwpHZFPDZ3X6D5OfAz4D4DTD6Cz1",
  },
];

async function main() {
  console.log("Start seeding ...");

  // payment_method & menu tidak punya kolom unik, jadi skipDuplicates tidak
  // berpengaruh. Cek isi tabel dulu agar seed aman dijalankan berulang.
  if ((await prisma.payment_method.count()) === 0) {
    await prisma.payment_method.createMany({
      data: [{ name: "Cash" }, { name: "QRIS" }, { name: "Debit Card" }],
    });
    console.log("- Metode pembayaran dibuat");
  }

  // table_number bersifat unik, jadi skipDuplicates bekerja.
  await prisma.table.createMany({
    data: ["1", "2", "3", "4", "5"].map((table_number) => ({
      table_number,
      status: "available",
    })),
    skipDuplicates: true,
  });
  console.log("- Meja dibuat");

  if ((await prisma.menu.count()) === 0) {
    await prisma.menu.createMany({ data: menus });
    console.log("- Menu dibuat");
  }

  // uid bersifat unik: akun yang sudah ada diperbarui, bukan diduplikasi.
  for (const user of staff) {
    await prisma.admin_account.upsert({
      where: { uid: user.uid },
      update: { email: user.email, full_name: user.full_name, role: user.role },
      create: user,
    });
  }
  console.log("- Akun staf dibuat/diperbarui");

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });