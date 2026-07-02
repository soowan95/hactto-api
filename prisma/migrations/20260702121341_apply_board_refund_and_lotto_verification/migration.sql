/*
  Warnings:

  - A unique constraint covering the columns `[lotto_identifier]` on the table `post` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nickname]` on the table `visitor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `personal_prediction` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `post` ADD COLUMN `is_blocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lotto_identifier` VARCHAR(500) NULL,
    ADD COLUMN `lotto_round` INTEGER NULL;

-- AlterTable
ALTER TABLE `prediction` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `visitor` ADD COLUMN `nickname` VARCHAR(30) NULL;

-- CreateTable
CREATE TABLE `banned_word` (
    `word` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`word`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_comment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `visitor_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `is_blocked` BOOLEAN NOT NULL DEFAULT false,
    `parent_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `post_comment_post_id_idx`(`post_id`),
    INDEX `post_comment_visitor_id_idx`(`visitor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_like` (
    `post_id` INTEGER NOT NULL,
    `visitor_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`post_id`, `visitor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comment_like` (
    `comment_id` INTEGER NOT NULL,
    `visitor_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`comment_id`, `visitor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comment_report` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comment_id` INTEGER NOT NULL,
    `visitor_id` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `answer` TEXT NULL,
    `status` ENUM('PENDING', 'RESOLVED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `answered_at` DATETIME(3) NULL,

    INDEX `comment_report_comment_id_idx`(`comment_id`),
    INDEX `comment_report_visitor_id_idx`(`visitor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nickname_report` (
    `id` VARCHAR(191) NOT NULL,
    `targetNickname` VARCHAR(30) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(200) NULL,
    `status` ENUM('PENDING', 'BLOCKED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `post_lotto_identifier_key` ON `post`(`lotto_identifier`);

-- CreateIndex
CREATE UNIQUE INDEX `visitor_nickname_key` ON `visitor`(`nickname`);

-- AddForeignKey
ALTER TABLE `post_comment` ADD CONSTRAINT `post_comment_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_comment` ADD CONSTRAINT `post_comment_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_comment` ADD CONSTRAINT `post_comment_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `post_comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_like` ADD CONSTRAINT `post_like_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_like` ADD CONSTRAINT `post_like_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_like` ADD CONSTRAINT `comment_like_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `post_comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_like` ADD CONSTRAINT `comment_like_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_report` ADD CONSTRAINT `comment_report_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `post_comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_report` ADD CONSTRAINT `comment_report_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
