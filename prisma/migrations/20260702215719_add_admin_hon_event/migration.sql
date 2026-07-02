-- AlterTable
ALTER TABLE `hon_event` ADD COLUMN `free_amount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `paid_amount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `admin_hon_event_setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
