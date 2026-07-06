-- CreateTable
CREATE TABLE `winning_shop` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `episode` INTEGER NOT NULL,
    `rank` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL,
    `shop_name` VARCHAR(191) NOT NULL,
    `shop_address` VARCHAR(191) NOT NULL,
    `purchase_type` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `shop_latitude` DOUBLE NULL,
    `shop_longitude` DOUBLE NULL,

    INDEX `winning_shop_episode_idx`(`episode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `winning_shop` ADD CONSTRAINT `winning_shop_episode_fkey` FOREIGN KEY (`episode`) REFERENCES `winning_number`(`episode`) ON DELETE CASCADE ON UPDATE CASCADE;
