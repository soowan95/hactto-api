/*
  Warnings:

  - You are about to drop the column `personal_weight_id` on the `reliability` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `reliability` DROP FOREIGN KEY `reliability_personal_weight_id_fkey`;

-- DropIndex
DROP INDEX `personal_weight_visitor_id_algorithm_key` ON `personal_weight`;

-- DropIndex
DROP INDEX `reliability_personal_weight_id_fkey` ON `reliability`;

-- AlterTable
ALTER TABLE `algorithm_result` ADD COLUMN `personal_weight_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `reliability` DROP COLUMN `personal_weight_id`;

-- AddForeignKey
ALTER TABLE `algorithm_result` ADD CONSTRAINT `algorithm_result_personal_weight_id_fkey` FOREIGN KEY (`personal_weight_id`) REFERENCES `personal_weight`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
