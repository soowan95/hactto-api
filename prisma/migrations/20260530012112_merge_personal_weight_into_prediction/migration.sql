/*
  Warnings:

  - You are about to drop the column `personal_weight_id` on the `prediction` table. All the data in the column will be lost.
  - You are about to drop the `personal_weight` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `weights` to the `prediction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `prediction` DROP FOREIGN KEY `prediction_personal_weight_id_fkey`;

-- DropIndex
DROP INDEX `prediction_personal_weight_id_fkey` ON `prediction`;

-- AlterTable
ALTER TABLE `prediction` DROP COLUMN `personal_weight_id`,
    ADD COLUMN `weights` VARCHAR(191) NOT NULL DEFAULT '[25,20,15,15,10,10,5]';

-- DropTable
DROP TABLE `personal_weight`;
