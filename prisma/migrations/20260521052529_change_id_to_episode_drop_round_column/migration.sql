/*
  Warnings:

  - The primary key for the `winning_number` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `winning_number` table. All the data in the column will be lost.
  - You are about to drop the column `round` on the `winning_number` table. All the data in the column will be lost.
  - Added the required column `episode` to the `winning_number` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `winning_number_round_key` ON `winning_number`;

-- AlterTable
ALTER TABLE `winning_number` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    DROP COLUMN `round`,
    ADD COLUMN `episode` INTEGER NOT NULL,
    ADD PRIMARY KEY (`episode`);
