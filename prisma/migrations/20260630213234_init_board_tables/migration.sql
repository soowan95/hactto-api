/*
  Warnings:

  - You are about to drop the column `is_blocked` on the `visitor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `visitor` DROP COLUMN `is_blocked`;

-- CreateTable
CREATE TABLE `post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitor_id` VARCHAR(191) NOT NULL,
    `category` ENUM('FREE', 'KNOWHOW', 'WINNING') NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `content` TEXT NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `post_visitor_id_idx`(`visitor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_report` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `visitor_id` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `answer` TEXT NULL,
    `status` ENUM('PENDING', 'RESOLVED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `answered_at` DATETIME(3) NULL,

    INDEX `post_report_post_id_idx`(`post_id`),
    INDEX `post_report_visitor_id_idx`(`visitor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `block` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitor_id` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `period` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NULL,

    UNIQUE INDEX `block_visitor_id_key`(`visitor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `post` ADD CONSTRAINT `post_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_report` ADD CONSTRAINT `post_report_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_report` ADD CONSTRAINT `post_report_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `block` ADD CONSTRAINT `block_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
