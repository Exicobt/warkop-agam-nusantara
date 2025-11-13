-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Waktu pembuatan: 04 Jun 2025 pada 18.10
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ansi_projek`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `admin_account`
--

CREATE TABLE `admin_account` (
  `id` int(11) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` enum('admin','kasir','dapur') DEFAULT 'kasir'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `admin_account`
--

INSERT INTO `admin_account` (`id`, `username`, `password`, `full_name`, `role`) VALUES
(1, 'admin', 'admin123', 'Aku Admin', 'admin'),
(2, 'kasir', 'kasir123', 'Aku Kasir', 'kasir'),
(3, 'dapur', 'dapur123', 'Aku Dapur', 'dapur');

-- --------------------------------------------------------

--
-- Struktur dari tabel `basket`
--

CREATE TABLE `basket` (
  `id` int(11) NOT NULL,
  `order_type_id` int(11) DEFAULT NULL,
  `create_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `customers_id` int(11) DEFAULT NULL,
  `status` enum('waiting','preparing','done','finish') NOT NULL DEFAULT 'waiting'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(26, 'Naufal', '2025-05-31 21:39:15', 8),
(27, 'Roro', '2025-05-31 21:39:53', 1),
(28, 'Naufal', '2025-05-31 21:45:10', 8),
(29, 'Andi', '2025-05-31 21:46:59', 2),
(30, 'Riski', '2025-05-31 22:09:56', 7),
(31, 'Riski', '2025-05-31 22:10:40', 7),
(32, 'Riski', '2025-05-31 22:15:20', 7),
(33, 'ada', '2025-05-31 22:16:53', 13),
(34, 'ada', '2025-05-31 22:17:30', NULL),
(35, 'wongso', '2025-05-31 22:21:09', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `kitchen`
--

CREATE TABLE `kitchen` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `status` enum('waiting','preparing','done','finish') DEFAULT 'waiting',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `menu`
--

INSERT INTO `menu` (`id`, `nama`, `kategori`, `harga`, `gambar`) VALUES
(3, 'Ayam Woku Manado', 'foods', 25800, 'data:image/jpeg;base64,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'),
(4, 'Nasi Bakar Ayam (Kemangi)', 'foods', 16800, ''),
(5, 'Nasi Ayam Asam Manis', 'foods', 16800, ''),
(6, 'Nasi Ayam Lada Hitam', 'foods', 16800, ''),
(7, 'Nasi Sop Ayam', 'foods', 17800, ''),
(8, 'Nasi Soto', 'foods', 17800, ''),
(10, 'Nasi Goreng Oriental', 'foods', 20800, ''),
(11, 'Nasi Goreng Saus Tiram', 'foods', 20800, ''),
(12, 'Chickbawl Katsu', 'foods', 17800, ''),
(13, 'Nila Tangkap', 'foods', 25800, ''),
(14, 'Mie Bangladesh', 'foods', 13800, ''),
(15, 'Mie Goreng Kampus', 'foods', 13800, ''),
(16, 'Soto Mie Medan', 'foods', 13800, ''),
(17, 'Spageti Bolognese', 'foods', 23800, ''),
(18, 'Rame Ramen', 'foods', 19800, ''),
(19, 'Tamago Ramen (Goreng)', 'foods', 19800, ''),
(32, 'affogato', 'foods', 20800, ''),
(33, 'café latte', 'drinks', 21700, ''),
(34, 'cappucino', 'drinks', 21800, ''),
(35, 'coffee brown sugar latte', 'drinks', 22800, ''),
(36, 'crème caramel machiato', 'drinks', 21800, ''),
(37, 'expresso double shoot', 'drinks', 21800, ''),
(38, 'expresso single shoot', 'drinks', 18800, ''),
(39, 'float chocoffee', 'drinks', 22800, ''),
(41, 'kopi susu', 'drinks', 18800, ''),
(44, 'picolo', 'drinks', 17800, ''),
(45, 'sweden coffee', 'drinks', 22800, ''),
(46, 'trio pineaple', 'drinks', 22800, ''),
(47, 'trio strawberry', 'drinks', 22800, ''),
(48, 'coffee pandan latte', 'drinks', 22800, ''),
(50, 'thai tea', 'drinks', 15000, ''),
(51, 'jasmine tea', 'drinks', 19800, ''),
(52, 'lemon tea', 'drinks', 15000, ''),
(53, 'lychee tea', 'drinks', 19800, ''),
(54, 'strawberry tea', 'drinks', 19800, ''),
(55, 'the hijau', 'drinks', 13000, ''),
(56, 'the hijau susu', 'drinks', 18000, ''),
(57, 'organic green tea', 'drinks', 12000, ''),
(58, 'the susu kayu manis', 'drinks', 17800, ''),
(62, 'mojito', 'drinks', 18800, ''),
(63, 'golden purple', 'drinks', 19800, ''),
(64, 'serah limau madu', 'drinks', 18800, ''),
(65, 'wedang jahe', 'drinks', 17800, ''),
(66, 'avococonut', 'drinks', 22500, ''),
(67, 'busan beach', 'drinks', 19800, ''),
(68, 'choco avocado', 'drinks', 22500, ''),
(69, 'es teler', 'drinks', 20800, ''),
(70, 'green house', 'drinks', 18800, ''),
(71, 'fresh orange', 'drinks', 18800, ''),
(72, 'orange coconut', 'drinks', 20800, ''),
(73, 'orange float', 'drinks', 20800, ''),
(74, 'summer lips', 'drinks', 18800, ''),
(75, 'mango ship', 'drinks', 19800, ''),
(76, 'mango jewels yakult', 'drinks', 19800, ''),
(77, 'orange jewels yakult', 'drinks', 19800, ''),
(79, 'strawberry chia yakult', 'drinks', 19800, ''),
(80, 'chocolate iced', 'drinks', 21800, ''),
(81, 'hokaido matcha latte iced', 'drinks', 21800, ''),
(82, 'hot chocolate', 'drinks', 21800, ''),
(83, 'milkshake strawberry', 'drinks', 20800, ''),
(84, 'milkshake cocholate', 'drinks', 20800, ''),
(85, 'milkshake vanilla', 'drinks', 20800, ''),
(86, 'redvelvet latte', 'drinks', 21800, ''),
(87, 'matcha latte', 'drinks', 21800, ''),
(90, 'choco milo float', 'drinks', 22500, ''),
(91, 'es kosong', 'drinks', 3800, ''),
(92, 'fanta susu', 'drinks', 10000, ''),
(93, 'kukubima', 'drinks', 8000, ''),
(94, 'kukubima susu', 'drinks', 10000, ''),
(96, 'milo susu', 'drinks', 12000, ''),
(97, 'mineral water', 'drinks', 4800, ''),
(98, 'nutrisari guava', 'drinks', 10000, ''),
(99, 'nutrisari jeruk', 'drinks', 10000, ''),
(100, 'nutrisari mangga', 'drinks', 10000, ''),
(101, 'nutrisari sirsak', 'drinks', 10000, ''),
(102, 'jus sawi nenas', 'drinks', 18000, ''),
(103, 'jus martabe', 'drinks', 18000, ''),
(104, 'jus wortel jeruk', 'drinks', 18000, ''),
(105, 'jus sirsak', 'drinks', 15000, ''),
(106, 'jus terong belanda', 'drinks', 15000, ''),
(107, 'jus markisa', 'drinks', 15000, ''),
(108, 'jus wortel ', 'drinks', 15000, ''),
(109, 'jus naga', 'drinks', 15000, ''),
(110, 'jus belimbing', 'drinks', 15000, ''),
(111, 'jus tomat', 'drinks', 15000, ''),
(112, 'ice cream kampus', 'drinks', 15800, ''),
(159, 'Dimsum Ayam', 'snacks', 21900, ''),
(160, 'Dimsum Rumput Laut', 'snacks', 21900, ''),
(161, 'Dimsum Udang', 'snacks', 21900, ''),
(162, 'Lumpia Udang', 'snacks', 21900, '');

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
(3, 7),
(4, 1),
(5, 2),
(6, 1),
(8, 1);

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

-- --------------------------------------------------------

--
-- Struktur dari tabel `order_type`
--

CREATE TABLE `order_type` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `order_type`
--

INSERT INTO `order_type` (`id`, `name`) VALUES
(1, 'dine in'),
(2, 'take away');

-- --------------------------------------------------------

--
-- Struktur dari tabel `table`
--

CREATE TABLE `table` (
  `id` int(11) NOT NULL,
  `table_number` varchar(191) NOT NULL,
  `status` enum('available','occupied','not_available') DEFAULT 'available',
  `location` enum('lantai 1','lantai 2') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `table`
--

INSERT INTO `table` (`id`, `table_number`, `status`, `location`) VALUES
(1, 'A1', 'available', 'lantai 1'),
(2, 'A2', 'available', 'lantai 1'),
(7, 'A3', 'available', 'lantai 1'),
(8, 'A4', 'available', 'lantai 1'),
(13, 'A5', 'available', 'lantai 1'),
(25, 'A6', 'available', 'lantai 1'),
(26, 'A7', 'available', 'lantai 1'),
(27, 'A8', 'available', 'lantai 1');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `_Admin_accountToOrders`
--

CREATE TABLE `_Admin_accountToOrders` (
  `A` int(11) NOT NULL,
  `B` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  ADD KEY `basket_order_type_id_idx` (`order_type_id`),
  ADD KEY `basket_customers_id_idx` (`customers_id`);

--
-- Indeks untuk tabel `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customers_table_id_fkey` (`table_id`);

--
-- Indeks untuk tabel `kitchen`
--
ALTER TABLE `kitchen`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

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
  ADD KEY `orders_menu_id_idx` (`menu_id`),
  ADD KEY `orders_basket_id_idx` (`basket_id`);

--
-- Indeks untuk tabel `order_type`
--
ALTER TABLE `order_type`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `table`
--
ALTER TABLE `table`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `table_table_number_key` (`table_number`);

--
-- Indeks untuk tabel `website_order`
--
ALTER TABLE `website_order`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `fk_menu_id` (`menu_id`);

--
-- Indeks untuk tabel `_Admin_accountToOrders`
--
ALTER TABLE `_Admin_accountToOrders`
  ADD UNIQUE KEY `_Admin_accountToOrders_AB_unique` (`A`,`B`),
  ADD KEY `_Admin_accountToOrders_B_index` (`B`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT untuk tabel `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT untuk tabel `kitchen`
--
ALTER TABLE `kitchen`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `menu`
--
ALTER TABLE `menu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=176;

--
-- AUTO_INCREMENT untuk tabel `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT untuk tabel `order_type`
--
ALTER TABLE `order_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `table`
--
ALTER TABLE `table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

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
  ADD CONSTRAINT `basket_order_type_id_fkey` FOREIGN KEY (`order_type_id`) REFERENCES `order_type` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_table_id_fkey` FOREIGN KEY (`table_id`) REFERENCES `table` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `kitchen`
--
ALTER TABLE `kitchen`
  ADD CONSTRAINT `kitchen_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

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
-- Ketidakleluasaan untuk tabel `website_order`
--
ALTER TABLE `website_order`
  ADD CONSTRAINT `fk_menu_id` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`),
  ADD CONSTRAINT `website_order_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `website_order_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `admin_account` (`id`);

--
-- Ketidakleluasaan untuk tabel `_Admin_accountToOrders`
--
ALTER TABLE `_Admin_accountToOrders`
  ADD CONSTRAINT `_Admin_accountToOrders_A_fkey` FOREIGN KEY (`A`) REFERENCES `admin_account` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `_Admin_accountToOrders_B_fkey` FOREIGN KEY (`B`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;