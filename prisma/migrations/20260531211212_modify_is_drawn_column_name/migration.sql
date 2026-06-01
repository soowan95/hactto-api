/*
  Warnings:

  - You are about to drop the column `isDrawn` on the `winning_number` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `winning_number` DROP COLUMN `isDrawn`,
    ADD COLUMN `is_drawn` BOOLEAN NOT NULL DEFAULT true;
