/*
  Warnings:

  - You are about to drop the `algorithm-result` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `reliability` DROP FOREIGN KEY `reliability_id_fkey`;

-- DropTable
DROP TABLE `algorithm-result`;

-- CreateTable
CREATE TABLE `algorithm_result` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first` INTEGER NOT NULL,
    `second` INTEGER NOT NULL,
    `third` INTEGER NOT NULL,
    `fourth` INTEGER NOT NULL,
    `fifth` INTEGER NOT NULL,
    `sixth` INTEGER NOT NULL,
    `bonus` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reliability` ADD CONSTRAINT `reliability_id_fkey` FOREIGN KEY (`id`) REFERENCES `algorithm_result`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
