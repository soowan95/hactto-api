/*
  Warnings:

  - A unique constraint covering the columns `[round]` on the table `winning_number` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bonus` to the `winning_number` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sixth` to the `winning_number` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `winning_number` ADD COLUMN `bonus` INTEGER NOT NULL,
    ADD COLUMN `sixth` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `winning_number_round_key` ON `winning_number`(`round`);
