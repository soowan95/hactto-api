-- AlterTable
ALTER TABLE `reliability` ADD COLUMN `personal_weight_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `reliability` ADD CONSTRAINT `reliability_personal_weight_id_fkey` FOREIGN KEY (`personal_weight_id`) REFERENCES `personal_weight`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
