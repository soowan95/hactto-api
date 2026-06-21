/*
  Warnings:

  - You are about to drop the column `balance` on the `hon` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `hon` DROP COLUMN `balance`,
    ADD COLUMN `free_balance` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `paid_balance` INTEGER NOT NULL DEFAULT 0;
