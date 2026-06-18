-- AlterTable
ALTER TABLE `inquiry` ADD COLUMN `payment_id` VARCHAR(191) NULL,
    ADD COLUMN `refund_status` ENUM('NONE', 'PENDING', 'PROPOSED', 'CONFIRMED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `type` ENUM('GENERAL', 'BLOCK', 'REFUND') NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE `hon_event` (
    `id` VARCHAR(191) NOT NULL,
    `visitor_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `balance` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `hon_event_visitor_id_idx`(`visitor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `hon_event` ADD CONSTRAINT `hon_event_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
