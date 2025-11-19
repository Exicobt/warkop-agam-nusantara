/*
  Warnings:

  - You are about to drop the column `location` on the `table` table. All the data in the column will be lost.
  - The values [occupied] on the enum `table_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `basket` MODIFY `status` ENUM('waiting', 'preparing', 'done', 'finish', 'cancelled') NOT NULL DEFAULT 'waiting';

-- AlterTable
ALTER TABLE `kitchen` MODIFY `status` ENUM('waiting', 'preparing', 'done', 'finish', 'cancelled') NULL DEFAULT 'waiting';

-- AlterTable
ALTER TABLE `table` DROP COLUMN `location`,
    MODIFY `status` ENUM('available', 'not_available') NULL DEFAULT 'available';

-- CreateTable
CREATE TABLE `Combo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComboItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `combo_id` INTEGER NOT NULL,
    `menu_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ComboItem` ADD CONSTRAINT `ComboItem_combo_id_fkey` FOREIGN KEY (`combo_id`) REFERENCES `Combo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComboItem` ADD CONSTRAINT `ComboItem_menu_id_fkey` FOREIGN KEY (`menu_id`) REFERENCES `menu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
