# 🧾 Aplikasi Kasir - Next.js + Prisma + MySQL

## 🚀 1. Clone Repository
```bash
git clone https://github.com/Exicobt/warkop-agam-nusantara.git
cd warkop-agam-nusantara
```

---

## 📦 2. Install Dependensi
```bash
npm install
```

---

## 🗃️ 4. Import Database SQL
Masuk ke folder `script/db_warkop.sql`, lalu import file SQL tersebut ke MySQL.
Kamu bisa menggunakan **phpMyAdmin** atau **MySQL CLI**.

---

## ⚙️ 3. Konfigurasi Environment

### Buat file `.env` di root folder
Isi dengan konfigurasi database MySQL kamu:
```bash
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/NAMA_DATABASE"
```
> Ganti `USER`, `PASSWORD`, dan `NAMA_DATABASE` sesuai konfigurasi MySQL kamu.

### Buat file `.env.local`
File ini digunakan untuk menyimpan **JWT Secret Key** (untuk autentikasi).
```bash
JWT_SECRET="xIrtrCeSrGJy7KJm3ub5Ej2fe1CYU9Pyyk6BhvYsdS0"
```
> Kamu bisa membuat JWT Secret baru dengan perintah:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
> ```

---

## 🗃️ 4. Import Database SQL
Masuk ke folder `script/db_warkop.sql`, lalu import file SQL tersebut ke MySQL.
Kamu bisa menggunakan **phpMyAdmin** atau **MySQL CLI**.

Contoh dengan MySQL CLI:
```bash
mysql -u USER -p NAMA_DATABASE < script/db_warkop.sql
```

---

## 🧩 5. Generate Prisma Client
```bash
npx prisma generate
```

---

## 🧱 6. Jalankan Migrasi Database
```bash
npx prisma migrate dev --name init
```

---

## 🖥️ 7. Jalankan Aplikasi
```bash
npm run dev
```
Lalu buka di browser:
👉 [http://localhost:3000](http://localhost:3000)

---

