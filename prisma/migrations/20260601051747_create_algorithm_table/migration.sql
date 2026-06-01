/*
  Warnings:

  - You are about to drop the column `algorithm` on the `prediction` table. All the data in the column will be lost.
  - Added the required column `algorithm_type` to the `prediction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `prediction` DROP COLUMN `algorithm`,
    ADD COLUMN `algorithm_type` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `algorithm` (
    `type` VARCHAR(191) NOT NULL,
    `complexity` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `prediction` ADD CONSTRAINT `prediction_algorithm_type_fkey` FOREIGN KEY (`algorithm_type`) REFERENCES `algorithm`(`type`) ON DELETE RESTRICT ON UPDATE CASCADE;
