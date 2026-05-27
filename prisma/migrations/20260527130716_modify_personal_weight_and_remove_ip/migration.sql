/*
  Warnings:

  - You are about to drop the column `ip` on the `algorithm_result` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `algorithm_result` DROP COLUMN `ip`;

-- CreateTable
CREATE TABLE `personal_weight` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitor_id` VARCHAR(191) NOT NULL,
    `algorithm` VARCHAR(191) NOT NULL,
    `weights` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `personal_weight_visitor_id_algorithm_key`(`visitor_id`, `algorithm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
