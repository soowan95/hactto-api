/*
  Warnings:

  - You are about to drop the column `bonus` on the `algorithm_result` table. All the data in the column will be lost.
  - You are about to drop the column `fifth` on the `algorithm_result` table. All the data in the column will be lost.
  - You are about to drop the column `first` on the `algorithm_result` table. All the data in the column will be lost.
  - You are about to drop the column `fourth` on the `algorithm_result` table. All the data in the column will be lost.
  - You are about to drop the column `second` on the `algorithm_result` table. All the data in the column will be lost.
  - You are about to drop the column `sixth` on the `algorithm_result` table. All the data in the column will be lost.
  - You are about to drop the column `third` on the `algorithm_result` table. All the data in the column will be lost.
  - You are about to drop the column `bonus` on the `winning_number` table. All the data in the column will be lost.
  - You are about to drop the column `fifth` on the `winning_number` table. All the data in the column will be lost.
  - You are about to drop the column `first` on the `winning_number` table. All the data in the column will be lost.
  - You are about to drop the column `fourth` on the `winning_number` table. All the data in the column will be lost.
  - You are about to drop the column `second` on the `winning_number` table. All the data in the column will be lost.
  - You are about to drop the column `sixth` on the `winning_number` table. All the data in the column will be lost.
  - You are about to drop the column `third` on the `winning_number` table. All the data in the column will be lost.
  - Added the required column `numbers` to the `algorithm_result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numbers` to the `winning_number` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `algorithm_result` DROP COLUMN `bonus`,
    DROP COLUMN `fifth`,
    DROP COLUMN `first`,
    DROP COLUMN `fourth`,
    DROP COLUMN `second`,
    DROP COLUMN `sixth`,
    DROP COLUMN `third`,
    ADD COLUMN `numbers` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `winning_number` DROP COLUMN `bonus`,
    DROP COLUMN `fifth`,
    DROP COLUMN `first`,
    DROP COLUMN `fourth`,
    DROP COLUMN `second`,
    DROP COLUMN `sixth`,
    DROP COLUMN `third`,
    ADD COLUMN `isDrawn` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `numbers` VARCHAR(191) NOT NULL;
