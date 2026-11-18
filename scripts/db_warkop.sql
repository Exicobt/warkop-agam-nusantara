-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 13 Des 2025 pada 16.33
-- Versi server: 10.4.28-MariaDB
-- Versi PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_warkop`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `admin_account`
--

CREATE TABLE `admin_account` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` enum('admin','kasir','dapur') DEFAULT 'kasir',
  `email` varchar(100) DEFAULT NULL,
  `uid` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `admin_account`
--

INSERT INTO `admin_account` (`id`, `full_name`, `role`, `email`, `uid`) VALUES
(1, 'Dapur User', 'dapur', 'dapur@gmail.com', 'PQPbM3XRG2W59FiYug0pXE4zQS52'),
(2, 'Kasir User', 'kasir', 'kasir@gmail.com', 'Dp2tj6jHFlSE4Micm50w5GPHB3p2'),
(3, 'Admin User', 'admin', 'admin@gmail.com', 'gwpHZFPDZ3X6D5OfAz4D4DTD6Cz1');

-- --------------------------------------------------------

--
-- Struktur dari tabel `basket`
--

CREATE TABLE `basket` (
  `id` int(11) NOT NULL,
  `create_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `customers_id` int(11) DEFAULT NULL,
  `status` enum('pending','waiting','preparing','done','finish','cancelled') NOT NULL DEFAULT 'pending',
  `payment_method_id` int(11) DEFAULT NULL,
  `total` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `basket`
--

INSERT INTO `basket` (`id`, `create_at`, `customers_id`, `status`, `payment_method_id`, `total`) VALUES
(1, '2025-12-13 05:59:30', 1, 'pending', NULL, 43000);

-- --------------------------------------------------------

--
-- Struktur dari tabel `combo`
--

CREATE TABLE `combo` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `price` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `combo`
--

INSERT INTO `combo` (`id`, `name`, `price`) VALUES
(1, 'Nasi Goreeng + Es Teh', 15000);

-- --------------------------------------------------------

--
-- Struktur dari tabel `comboitem`
--

CREATE TABLE `comboitem` (
  `id` int(11) NOT NULL,
  `combo_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `comboitem`
--

INSERT INTO `comboitem` (`id`, `combo_id`, `menu_id`) VALUES
(3, 1, 1),
(4, 1, 6);

-- --------------------------------------------------------

--
-- Struktur dari tabel `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `create_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `table_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `customers`
--

INSERT INTO `customers` (`id`, `name`, `create_at`, `table_id`) VALUES
(1, 'Meja 3', '2025-12-13 05:59:28', 3);

-- --------------------------------------------------------

--
-- Struktur dari tabel `menu`
--

CREATE TABLE `menu` (
  `id` int(11) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `kategori` enum('foods','drinks','snacks') NOT NULL,
  `harga` int(11) NOT NULL,
  `gambar` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `menu`
--

INSERT INTO `menu` (`id`, `nama`, `kategori`, `harga`, `gambar`) VALUES
(1, 'Nasi Goreng', 'foods', 25000, ''),
(2, 'Mie Goreng', 'foods', 22000, ''),
(3, 'Ayam Bakar', 'foods', 35000, ''),
(4, 'Sate Ayam', 'foods', 28000, ''),
(5, 'Kopi Hitam', 'drinks', 10000, ''),
(6, 'Es Teh', 'drinks', 8000, ''),
(7, 'Jus Alpukat', 'drinks', 15000, ''),
(8, 'Kentang Goreng', 'snacks', 18000, ''),
(9, 'Roti Bakar', 'snacks', 16000, ''),
(10, 'Pisang Goreng', 'snacks', 12000, '');

-- --------------------------------------------------------

--
-- Struktur dari tabel `menu_stats`
--

CREATE TABLE `menu_stats` (
  `menu_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `menu_stats`
--

INSERT INTO `menu_stats` (`menu_id`, `quantity`) VALUES
(1, 1),
(4, 1),
(6, 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `basket_id` int(11) DEFAULT NULL,
  `menu_id` int(11) DEFAULT NULL,
  `qty` int(11) NOT NULL,
  `total` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `orders`
--

INSERT INTO `orders` (`id`, `basket_id`, `menu_id`, `qty`, `total`) VALUES
(1, 1, 1, 1, 25000),
(2, 1, 6, 1, 8000),
(3, 1, 4, 1, 28000);

-- --------------------------------------------------------

--
-- Struktur dari tabel `payment_method`
--

CREATE TABLE `payment_method` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `payment_method`
--

INSERT INTO `payment_method` (`id`, `name`) VALUES
(1, 'Cash'),
(2, 'QRIS'),
(3, 'Debit Card');

-- --------------------------------------------------------

--
-- Struktur dari tabel `table`
--

CREATE TABLE `table` (
  `id` int(11) NOT NULL,
  `table_number` varchar(191) NOT NULL,
  `status` enum('available','occupied','not_available') DEFAULT 'available',
  `qr_generated_at` timestamp NULL DEFAULT NULL,
  `qr_token` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `table`
--

INSERT INTO `table` (`id`, `table_number`, `status`, `qr_generated_at`, `qr_token`) VALUES
(1, '1', 'available', NULL, NULL),
(2, '2', 'available', NULL, NULL),
(3, '3', 'available', '2025-12-13 05:38:48', NULL),
(4, '4', 'available', NULL, NULL),
(5, '5', 'available', NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `table_sessions`
--

CREATE TABLE `table_sessions` (
  `id` varchar(191) NOT NULL,
  `table_number` varchar(10) NOT NULL,
  `token` varchar(100) NOT NULL,
  `status` enum('active','used','expired','cancelled') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expired_at` timestamp NULL DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `table_sessions`
--

INSERT INTO `table_sessions` (`id`, `table_number`, `token`, `status`, `created_at`, `expired_at`, `order_id`) VALUES
('77acec68-5297-40c5-a552-e1c4adf72795', '3', 'a2a38b54-7abb-47ba-b47e-cbaa2882e734', 'active', '2025-12-13 05:38:47', '2025-12-13 09:38:47', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `website_order`
--

CREATE TABLE `website_order` (
  `id` int(11) NOT NULL,
  `table_number` varchar(10) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `menu_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `_admin_accounttoorders`
--

CREATE TABLE `_admin_accounttoorders` (
  `A` int(11) NOT NULL,
  `B` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('0e88b69f-3aff-44bf-825b-dc3224414c25', 'ea5dc9e4e6b32cd5e3e428c0137c1c8e26619bb7b934b3d17ac95769da306bed', '2025-12-13 10:53:27.290', '20251118071257_init', NULL, NULL, '2025-12-13 10:53:13.036', 1),
('2af24b2d-743f-4ce2-99da-01e211dc9116', 'bfc0064ba0b433678197b792bc8ab806a3f61e4618cb5fbb60735de608c82d3c', '2025-12-13 10:53:12.923', '20251113045821_', NULL, NULL, '2025-12-13 10:52:23.272', 1),
('3672898b-f7b2-4247-a79a-3cb8481ffe79', 'df7999e4b0040759241a09ef1b1e4c808bd0dc6893c90ef3d98c279ec96479d0', '2025-12-13 10:53:34.841', '20251118083351_', NULL, NULL, '2025-12-13 10:53:27.659', 1),
('450354ac-1ae7-43c7-bc2a-641bb9d69bce', '4247904bfd0300157f5406beae836074b04ef882a47c82112f907aa670a33af8', '2025-12-13 12:29:04.377', '20251213122859_update', NULL, NULL, '2025-12-13 12:28:59.527', 1),
('6e83727e-ef77-4e03-82d0-a4e84b3be151', '1becc126dfbdc7c0f033afe4214fd97fb98462e4f62222c32464fb5a3923b3fa', '2025-12-13 10:53:45.234', '20251126205729_update_db', NULL, NULL, '2025-12-13 10:53:44.380', 1),
('c8c4c29f-f1cd-427d-bae4-320f5a9ecb20', '6871704f917c8e4b20e2691626ce603863541e43f0ff20e0a88adb911c1d81b8', '2025-12-13 10:53:36.017', '20251125124904_', NULL, NULL, '2025-12-13 10:53:34.980', 1),
('ede6f81a-da0c-43ba-8bcb-8946fa0b35b2', 'de5530b2ed2125e12e738022f8be27126ce5f9255015e8a7a344c7b761f5558e', '2025-12-13 10:53:44.147', '20251126204145_update_db', NULL, NULL, '2025-12-13 10:53:36.180', 1);

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `admin_account`
--
ALTER TABLE `admin_account`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `basket`
--
ALTER TABLE `basket`
  ADD PRIMARY KEY (`id`),
  ADD KEY `basket_customers_id_idx` (`customers_id`),
  ADD KEY `basket_payment_method_id_idx` (`payment_method_id`);

--
-- Indeks untuk tabel `combo`
--
ALTER TABLE `combo`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `comboitem`
--
ALTER TABLE `comboitem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ComboItem_combo_id_fkey` (`combo_id`),
  ADD KEY `ComboItem_menu_id_fkey` (`menu_id`);

--
-- Indeks untuk tabel `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customers_table_id_fkey` (`table_id`);

--
-- Indeks untuk tabel `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `menu_stats`
--
ALTER TABLE `menu_stats`
  ADD PRIMARY KEY (`menu_id`);

--
-- Indeks untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orders_basket_id_idx` (`basket_id`),
  ADD KEY `orders_menu_id_idx` (`menu_id`);

--
-- Indeks untuk tabel `payment_method`
--
ALTER TABLE `payment_method`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `table`
--
ALTER TABLE `table`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `table_table_number_key` (`table_number`);

--
-- Indeks untuk tabel `table_sessions`
--
ALTER TABLE `table_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `table_sessions_token_key` (`token`),
  ADD KEY `table_sessions_table_number_idx` (`table_number`),
  ADD KEY `table_sessions_token_idx` (`token`),
  ADD KEY `table_sessions_status_idx` (`status`),
  ADD KEY `table_sessions_expired_at_idx` (`expired_at`);

--
-- Indeks untuk tabel `website_order`
--
ALTER TABLE `website_order`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `fk_menu_id` (`menu_id`);

--
-- Indeks untuk tabel `_admin_accounttoorders`
--
ALTER TABLE `_admin_accounttoorders`
  ADD UNIQUE KEY `_Admin_accountToOrders_AB_unique` (`A`,`B`),
  ADD KEY `_Admin_accountToOrders_B_index` (`B`);

--
-- Indeks untuk tabel `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `admin_account`
--
ALTER TABLE `admin_account`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `basket`
--
ALTER TABLE `basket`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `combo`
--
ALTER TABLE `combo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `comboitem`
--
ALTER TABLE `comboitem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `menu`
--
ALTER TABLE `menu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT untuk tabel `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `payment_method`
--
ALTER TABLE `payment_method`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `table`
--
ALTER TABLE `table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `website_order`
--
ALTER TABLE `website_order`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `basket`
--
ALTER TABLE `basket`
  ADD CONSTRAINT `basket_customers_id_fkey` FOREIGN KEY (`customers_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `basket_payment_method_id_fkey` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_method` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `comboitem`
--
ALTER TABLE `comboitem`
  ADD CONSTRAINT `ComboItem_combo_id_fkey` FOREIGN KEY (`combo_id`) REFERENCES `combo` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `ComboItem_menu_id_fkey` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_table_id_fkey` FOREIGN KEY (`table_id`) REFERENCES `table` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `menu_stats`
--
ALTER TABLE `menu_stats`
  ADD CONSTRAINT `menu_stats_menu_id_fkey` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_basket_id_fkey` FOREIGN KEY (`basket_id`) REFERENCES `basket` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_menu_id_fkey` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `table_sessions`
--
ALTER TABLE `table_sessions`
  ADD CONSTRAINT `table_sessions_table_number_fkey` FOREIGN KEY (`table_number`) REFERENCES `table` (`table_number`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `website_order`
--
ALTER TABLE `website_order`
  ADD CONSTRAINT `fk_menu_id` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`),
  ADD CONSTRAINT `website_order_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `website_order_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `admin_account` (`id`);

--
-- Ketidakleluasaan untuk tabel `_admin_accounttoorders`
--
ALTER TABLE `_admin_accounttoorders`
  ADD CONSTRAINT `_Admin_accountToOrders_A_fkey` FOREIGN KEY (`A`) REFERENCES `admin_account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `_Admin_accountToOrders_B_fkey` FOREIGN KEY (`B`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
