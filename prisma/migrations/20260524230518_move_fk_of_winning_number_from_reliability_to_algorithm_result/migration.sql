/*
  Warnings:

  - You are about to drop the column `algorithm` on the `reliability` table. All the data in the column will be lost.
  - You are about to drop the column `episode` on the `reliability` table. All the data in the column will be lost.
  - Added the required column `algorithm` to the `algorithm_result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `episode` to the `algorithm_result` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `reliability` DROP FOREIGN KEY `reliability_episode_fkey`;

-- DropIndex
DROP INDEX `reliability_episode_fkey` ON `reliability`;

-- AlterTable
ALTER TABLE `algorithm_result` ADD COLUMN `algorithm` VARCHAR(191) NOT NULL,
    ADD COLUMN `episode` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `reliability` DROP COLUMN `algorithm`,
    DROP COLUMN `episode`;

-- AddForeignKey
ALTER TABLE `algorithm_result` ADD CONSTRAINT `algorithm_result_episode_fkey` FOREIGN KEY (`episode`) REFERENCES `winning_number`(`episode`) ON DELETE RESTRICT ON UPDATE CASCADE;
