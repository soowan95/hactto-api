-- CreateTable
CREATE TABLE `WinningNumber` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `round` INTEGER NOT NULL,
    `first` INTEGER NOT NULL,
    `second` INTEGER NOT NULL,
    `third` INTEGER NOT NULL,
    `fourth` INTEGER NOT NULL,
    `fifth` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
