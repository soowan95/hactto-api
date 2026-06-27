/*
  Warnings:

  - Added the required column `cnt_0s` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cnt_10s` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cnt_20s` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cnt_30s` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cnt_40s` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_digit0` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_digit1` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_digit2` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_digit3` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_digit4` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_digit5` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_digit6` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_digit7` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_digit8` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_digit9` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sum` to the `analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sum_last_digits` to the `analysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `analysis` ADD COLUMN `cnt_0s` INTEGER NOT NULL,
    ADD COLUMN `cnt_10s` INTEGER NOT NULL,
    ADD COLUMN `cnt_20s` INTEGER NOT NULL,
    ADD COLUMN `cnt_30s` INTEGER NOT NULL,
    ADD COLUMN `cnt_40s` INTEGER NOT NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `last_digit0` VARCHAR(191) NOT NULL,
    ADD COLUMN `last_digit1` VARCHAR(191) NOT NULL,
    ADD COLUMN `last_digit2` VARCHAR(191) NOT NULL,
    ADD COLUMN `last_digit3` VARCHAR(191) NOT NULL,
    ADD COLUMN `last_digit4` VARCHAR(191) NOT NULL,
    ADD COLUMN `last_digit5` VARCHAR(191) NOT NULL,
    ADD COLUMN `last_digit6` VARCHAR(191) NOT NULL,
    ADD COLUMN `last_digit7` VARCHAR(191) NOT NULL,
    ADD COLUMN `last_digit8` VARCHAR(191) NOT NULL,
    ADD COLUMN `last_digit9` VARCHAR(191) NOT NULL,
    ADD COLUMN `sum` INTEGER NOT NULL,
    ADD COLUMN `sum_last_digits` INTEGER NOT NULL;
