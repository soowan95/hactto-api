/*
  Warnings:

  - You are about to drop the `WinningNumber` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `WinningNumber`;

-- CreateTable
CREATE TABLE `winning_number` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `round` INTEGER NOT NULL,
    `first` INTEGER NOT NULL,
    `second` INTEGER NOT NULL,
    `third` INTEGER NOT NULL,
    `fourth` INTEGER NOT NULL,
    `fifth` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
