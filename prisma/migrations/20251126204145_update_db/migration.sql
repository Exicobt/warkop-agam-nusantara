-- AlterTable
ALTER TABLE `basket` MODIFY `status` ENUM('pending', 'waiting', 'preparing', 'done', 'finish', 'cancelled') NOT NULL DEFAULT 'waiting';

-- AlterTable
ALTER TABLE `kitchen` MODIFY `status` ENUM('pending', 'waiting', 'preparing', 'done', 'finish', 'cancelled') NULL DEFAULT 'waiting';

-- AlterTable
ALTER TABLE `table` MODIFY `status` ENUM('available', 'occupied', 'not_available') NULL DEFAULT 'available';
