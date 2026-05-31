/*
  Warnings:

  - You are about to drop the column `numbers` on the `winning_number` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `prediction` ALTER COLUMN `weights` DROP DEFAULT;

-- AlterTable
ALTER TABLE `winning_number` DROP COLUMN `numbers`,
    ADD COLUMN `lt1_wn_no` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lt2_wn_no` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lt3_wn_no` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lt4_wn_no` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lt5_wn_no` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lt6_wn_no` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lt_bns_wn_no` INTEGER NOT NULL DEFAULT 0;
