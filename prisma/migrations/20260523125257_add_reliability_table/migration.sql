-- CreateTable
CREATE TABLE `reliability` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `algorithm` VARCHAR(191) NOT NULL,
    `episode` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reliability` ADD CONSTRAINT `reliability_episode_fkey` FOREIGN KEY (`episode`) REFERENCES `winning_number`(`episode`) ON DELETE RESTRICT ON UPDATE CASCADE;
