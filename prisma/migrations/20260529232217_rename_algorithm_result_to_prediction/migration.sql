/*
  Warnings:

  - You are about to drop the `algorithm_result` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `algorithm_result` DROP FOREIGN KEY `algorithm_result_episode_fkey`;

-- DropForeignKey
ALTER TABLE `algorithm_result` DROP FOREIGN KEY `algorithm_result_personal_weight_id_fkey`;

-- DropForeignKey
ALTER TABLE `reliability` DROP FOREIGN KEY `reliability_id_fkey`;

-- DropTable
DROP TABLE `algorithm_result`;

-- CreateTable
CREATE TABLE `prediction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `algorithm` VARCHAR(191) NOT NULL,
    `episode` INTEGER NOT NULL,
    `numbers` VARCHAR(191) NOT NULL,
    `visitor_id` VARCHAR(191) NULL,
    `personal_weight_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `prediction` ADD CONSTRAINT `prediction_episode_fkey` FOREIGN KEY (`episode`) REFERENCES `winning_number`(`episode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prediction` ADD CONSTRAINT `prediction_personal_weight_id_fkey` FOREIGN KEY (`personal_weight_id`) REFERENCES `personal_weight`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reliability` ADD CONSTRAINT `reliability_id_fkey` FOREIGN KEY (`id`) REFERENCES `prediction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
