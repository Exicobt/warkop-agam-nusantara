/*
  Warnings:

  - You are about to drop the column `password` on the `admin_account` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `admin_account` table. All the data in the column will be lost.
  - Added the required column `uid` to the `admin_account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `admin_account` DROP COLUMN `password`,
    DROP COLUMN `username`,
    ADD COLUMN `email` VARCHAR(100) NULL,
    ADD COLUMN `uid` VARCHAR(100) NOT NULL;
