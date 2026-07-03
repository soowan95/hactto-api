-- AlterTable
ALTER TABLE `post` ADD COLUMN `is_admin` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `original_file_name` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `post_comment` ADD COLUMN `is_admin` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `post_attachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `image_url` VARCHAR(1000) NOT NULL,
    `original_file_name` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `post_attachment_post_id_idx`(`post_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitorId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `content` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_visitorId_idx`(`visitorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `post_attachment` ADD CONSTRAINT `post_attachment_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_visitorId_fkey` FOREIGN KEY (`visitorId`) REFERENCES `visitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
