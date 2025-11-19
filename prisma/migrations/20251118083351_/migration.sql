-- AlterTable
ALTER TABLE `table` ADD COLUMN `qr_generated_at` TIMESTAMP(0) NULL,
    ADD COLUMN `qr_token` VARCHAR(100) NULL;

-- CreateTable
CREATE TABLE `table_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `table_number` VARCHAR(10) NOT NULL,
    `token` VARCHAR(100) NOT NULL,
    `status` ENUM('active', 'used', 'expired', 'cancelled') NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `expired_at` TIMESTAMP(0) NULL,
    `order_id` INTEGER NULL,

    UNIQUE INDEX `table_sessions_token_key`(`token`),
    INDEX `table_sessions_table_number_idx`(`table_number`),
    INDEX `table_sessions_token_idx`(`token`),
    INDEX `table_sessions_status_idx`(`status`),
    INDEX `table_sessions_expired_at_idx`(`expired_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `table_sessions` ADD CONSTRAINT `table_sessions_table_number_fkey` FOREIGN KEY (`table_number`) REFERENCES `table`(`table_number`) ON DELETE CASCADE ON UPDATE CASCADE;
