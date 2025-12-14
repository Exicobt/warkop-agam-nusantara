/*
  Warnings:

  - You are about to drop the column `order_type_id` on the `basket` table. All the data in the column will be lost.
  - You are about to drop the `order_type` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `basket` DROP FOREIGN KEY `basket_order_type_id_fkey`;

-- DropIndex
DROP INDEX `basket_order_type_id_idx` ON `basket`;

-- AlterTable
ALTER TABLE `basket` DROP COLUMN `order_type_id`,
    ADD COLUMN `total` INTEGER NULL;

-- DropTable
DROP TABLE `order_type`;
