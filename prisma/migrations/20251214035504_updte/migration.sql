-- AlterTable
ALTER TABLE `basket` ADD COLUMN `tipe_order` ENUM('dine_in', 'take_away') NOT NULL DEFAULT 'dine_in';
