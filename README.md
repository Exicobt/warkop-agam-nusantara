# ☕ Warkop Agam Nusantara — Sistem Kasir (POS)

Next.js 16 + Prisma + PostgreSQL + Firebase Auth. Tiga panel staf (admin, kasir, dapur) dan halaman pemesanan pelanggan lewat QR meja.

| Role   | Halaman      | Fungsi |
|--------|--------------|--------|
| admin  | `/dashboard` | Dashboard MIS (KPI, tren, jam sibuk, menu terlaris), Monitor Pesanan, Laporan Penjualan (ekspor CSV/cetak), riwayat, kelola menu/kombo/meja |
| kasir  | `/cashier`   | Terima/tolak pesanan, pesanan walk-in, pembayaran, cetak struk |
| dapur  | `/dapur`     | Antrian masak (menunggu → memasak → siap) |
| publik | `/kasir/<token>` | Pelanggan memesan lewat QR di meja (sekali pakai) |

Alur status: `pending → waiting → preparing → done → finish` (atau `cancelled`). Aturan transisi dan perubahan status meja ada di `src/lib/order-status.js`.

## Menjalankan

```bash
npm install
cp .env.example .env        # lalu isi semua nilai (lihat di bawah)
npx prisma migrate deploy   # buat tabel dari folder prisma/migrations
npm run seed                # opsional: metode bayar, meja, menu contoh, akun staf contoh
npm run dev                 # http://localhost:3000
```

> Pilih **salah satu**: `prisma migrate deploy` *atau* impor `scripts/db_warkop.sql`. Jangan keduanya pada database yang sama.

## Konfigurasi (`.env`)

Lihat `.env.example`. Yang wajib:

- `DATABASE_URL` — koneksi MySQL.
- `JWT_SECRET` — minimal 32 karakter. Buat: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
- `NEXT_PUBLIC_APP_URL` — URL publik aplikasi (dipakai di link QR).
- `NEXT_PUBLIC_FIREBASE_*` — config web Firebase (publik).
- `FB_PROJECT_ID`, `FB_CLIENT_EMAIL`, `FB_PRIVATE_KEY` — kredensial **Firebase Admin** (rahasia), dari Firebase Console → Project settings → Service accounts.

## Menambah akun staf

1. Buat user (email + password) di Firebase Console → Authentication.
2. Tambahkan baris di tabel `admin_account` dengan `uid` = UID user Firebase tersebut dan `role` = `admin` / `kasir` / `dapur`.

`prisma/seed.js` berisi UID contoh milik project Firebase lama; ganti dengan UID akun Anda sebelum seed.

## Keamanan — penting

- Login: browser mengirim **ID token Firebase**; server memverifikasinya dengan Firebase Admin, lalu menerbitkan cookie sesi JWT (HttpOnly, 8 jam). Middleware (`src/proxy.js`) dan setiap API memverifikasi tanda tangan JWT tersebut.
- Harga pesanan selalu dihitung di server dari database; klien hanya mengirim id dan jumlah.
- **Jangan pernah commit** file service account Firebase atau `.env` (sudah ada di `.gitignore`).

## Skrip

`npm run dev` · `npm run build` · `npm start` · `npm run lint` · `npm run seed`


## Catatan perubahan terbaru

- **Sesi geser**: cookie sesi diperpanjang otomatis saat polling (maks. 24 jam sejak login). Sebelumnya layar dapur yang dibiarkan menyala > 8 jam gagal update status tanpa pesan jelas.
- **Layar dapur**: update optimistic, tombol anti-klik ganda, banner sesi berakhir/offline, bunyi pesanan baru.
- `POST /api/orders` idempoten bila status sudah sama; `GET /api/orders` menerima `?to=`.
