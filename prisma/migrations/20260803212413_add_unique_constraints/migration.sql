/*
  Warnings:

  - You are about to drop the column `last_failed_at` on the `login_fail_log` table. All the data in the column will be lost.
  - The primary key for the `privacy_policy` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `is_active` on the `privacy_policy` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `privacy_policy` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `privacy_policy` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `version` on the `privacy_policy` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - The primary key for the `terms_of_service` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `is_active` on the `terms_of_service` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `terms_of_service` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `terms_of_service` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `version` on the `terms_of_service` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(8)`.
  - A unique constraint covering the columns `[ip,email]` on the table `login_fail_log` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[restore_token]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `login_fail_log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `block` DROP FOREIGN KEY `block_visitor_id_fkey`;

-- DropForeignKey
ALTER TABLE `comment_like` DROP FOREIGN KEY `comment_like_visitor_id_fkey`;

-- DropForeignKey
ALTER TABLE `comment_report` DROP FOREIGN KEY `comment_report_visitor_id_fkey`;

-- DropForeignKey
ALTER TABLE `hon` DROP FOREIGN KEY `hon_visitor_id_fkey`;

-- DropForeignKey
ALTER TABLE `hon_event` DROP FOREIGN KEY `hon_event_visitor_id_fkey`;

-- DropForeignKey
ALTER TABLE `inquiry` DROP FOREIGN KEY `inquiry_visitor_id_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `notification_visitorId_fkey`;

-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `post_visitor_id_fkey`;

-- DropForeignKey
ALTER TABLE `post_comment` DROP FOREIGN KEY `post_comment_visitor_id_fkey`;

-- DropForeignKey
ALTER TABLE `post_like` DROP FOREIGN KEY `post_like_visitor_id_fkey`;

-- DropForeignKey
ALTER TABLE `post_report` DROP FOREIGN KEY `post_report_visitor_id_fkey`;

-- DropForeignKey
ALTER TABLE `subscription` DROP FOREIGN KEY `subscription_visitor_id_fkey`;

-- AlterTable
ALTER TABLE `login_fail_log` DROP COLUMN `last_failed_at`,
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `locked_until` DATETIME(3) NULL,
    MODIFY `fail_count` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `prediction` MODIFY `user_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `privacy_policy` DROP PRIMARY KEY,
    DROP COLUMN `is_active`,
    DROP COLUMN `updated_at`,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `version` VARCHAR(50) NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `terms_of_service` DROP PRIMARY KEY,
    DROP COLUMN `is_active`,
    DROP COLUMN `updated_at`,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `version` VARCHAR(50) NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    ADD COLUMN `avatar_url` VARCHAR(500) NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `password` VARCHAR(191) NULL,
    ADD COLUMN `provider` VARCHAR(191) NOT NULL DEFAULT 'local',
    ADD COLUMN `provider_id` VARCHAR(191) NULL,
    ADD COLUMN `restore_token` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `id` VARCHAR(8) NOT NULL,
    MODIFY `ip` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE UNIQUE INDEX `login_fail_log_ip_email_key` ON `login_fail_log`(`ip`, `email`);

-- CreateIndex
CREATE UNIQUE INDEX `user_email_key` ON `user`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `user_restore_token_key` ON `user`(`restore_token`);

-- AddForeignKey
ALTER TABLE `inquiry` ADD CONSTRAINT `inquiry_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `block` ADD CONSTRAINT `block_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post` ADD CONSTRAINT `post_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_report` ADD CONSTRAINT `post_report_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_comment` ADD CONSTRAINT `post_comment_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_like` ADD CONSTRAINT `post_like_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_like` ADD CONSTRAINT `comment_like_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_report` ADD CONSTRAINT `comment_report_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hon` ADD CONSTRAINT `hon_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription` ADD CONSTRAINT `subscription_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hon_event` ADD CONSTRAINT `hon_event_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RedefineIndex
CREATE UNIQUE INDEX `block_user_id_key` ON `block`(`user_id`);
DROP INDEX `block_visitor_id_key` ON `block`;

-- RedefineIndex
CREATE INDEX `comment_report_user_id_idx` ON `comment_report`(`user_id`);
DROP INDEX `comment_report_visitor_id_idx` ON `comment_report`;

-- RedefineIndex
CREATE INDEX `hon_event_user_id_idx` ON `hon_event`(`user_id`);
DROP INDEX `hon_event_visitor_id_idx` ON `hon_event`;

-- RedefineIndex
CREATE INDEX `inquiry_user_id_idx` ON `inquiry`(`user_id`);
DROP INDEX `inquiry_visitor_id_idx` ON `inquiry`;

-- RedefineIndex
CREATE INDEX `notification_userId_idx` ON `notification`(`userId`);
DROP INDEX `notification_visitorId_idx` ON `notification`;

-- RedefineIndex
CREATE INDEX `payment_projection_user_id_idx` ON `payment_projection`(`user_id`);
DROP INDEX `payment_projection_visitor_id_idx` ON `payment_projection`;

-- RedefineIndex
CREATE INDEX `post_user_id_idx` ON `post`(`user_id`);
DROP INDEX `post_visitor_id_idx` ON `post`;

-- RedefineIndex
CREATE INDEX `post_comment_user_id_idx` ON `post_comment`(`user_id`);
DROP INDEX `post_comment_visitor_id_idx` ON `post_comment`;

-- RedefineIndex
CREATE INDEX `post_report_user_id_idx` ON `post_report`(`user_id`);
DROP INDEX `post_report_visitor_id_idx` ON `post_report`;

-- RedefineIndex
CREATE UNIQUE INDEX `user_nickname_key` ON `user`(`nickname`);
DROP INDEX `visitor_nickname_key` ON `user`;
