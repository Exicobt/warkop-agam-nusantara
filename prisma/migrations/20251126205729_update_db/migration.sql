/*
  Warnings:

  - You are about to drop the `kitchen` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `kitchen` DROP FOREIGN KEY `kitchen_order_fk`;

-- AlterTable
ALTER TABLE `basket` MODIFY `status` ENUM('pending', 'waiting', 'preparing', 'done', 'finish', 'cancelled') NOT NULL DEFAULT 'pending';

-- DropTable
DROP TABLE `kitchen`;
