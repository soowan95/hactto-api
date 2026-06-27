/*
  Warnings:

  - You are about to drop the `reliability` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `reliability` DROP FOREIGN KEY `reliability_id_fkey`;

-- DropTable
DROP TABLE `reliability`;

-- CreateTable
CREATE TABLE `analysis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reliability` INTEGER NOT NULL,
    `even` INTEGER NOT NULL,
    `odd` INTEGER NOT NULL,
    `hot` INTEGER NOT NULL,
    `warm` INTEGER NOT NULL,
    `cold` INTEGER NOT NULL,
    `low` INTEGER NOT NULL,
    `high` INTEGER NOT NULL,
    `ac` INTEGER NOT NULL,
    `consecutive` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prediction_analysis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `analysis_id` INTEGER NOT NULL,
    `prediction_id` INTEGER NOT NULL,

    UNIQUE INDEX `prediction_analysis_analysis_id_key`(`analysis_id`),
    UNIQUE INDEX `prediction_analysis_prediction_id_key`(`prediction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `winning_number_analysis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `analysis_id` INTEGER NOT NULL,
    `episode` INTEGER NOT NULL,

    UNIQUE INDEX `winning_number_analysis_analysis_id_key`(`analysis_id`),
    UNIQUE INDEX `winning_number_analysis_episode_key`(`episode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `prediction_analysis` ADD CONSTRAINT `prediction_analysis_analysis_id_fkey` FOREIGN KEY (`analysis_id`) REFERENCES `analysis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prediction_analysis` ADD CONSTRAINT `prediction_analysis_prediction_id_fkey` FOREIGN KEY (`prediction_id`) REFERENCES `prediction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `winning_number_analysis` ADD CONSTRAINT `winning_number_analysis_analysis_id_fkey` FOREIGN KEY (`analysis_id`) REFERENCES `analysis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `winning_number_analysis` ADD CONSTRAINT `winning_number_analysis_episode_fkey` FOREIGN KEY (`episode`) REFERENCES `winning_number`(`episode`) ON DELETE CASCADE ON UPDATE CASCADE;
