-- CreateTable
CREATE TABLE `personal_analysis` (
    `id` INTEGER NOT NULL,
    `sum` INTEGER NOT NULL,
    `cnt_0s` INTEGER NOT NULL,
    `cnt_10s` INTEGER NOT NULL,
    `cnt_20s` INTEGER NOT NULL,
    `cnt_30s` INTEGER NOT NULL,
    `cnt_40s` INTEGER NOT NULL,
    `sum_last_digits` INTEGER NOT NULL,
    `last_digit0` VARCHAR(191) NOT NULL,
    `last_digit1` VARCHAR(191) NOT NULL,
    `last_digit2` VARCHAR(191) NOT NULL,
    `last_digit3` VARCHAR(191) NOT NULL,
    `last_digit4` VARCHAR(191) NOT NULL,
    `last_digit5` VARCHAR(191) NOT NULL,
    `last_digit6` VARCHAR(191) NOT NULL,
    `last_digit7` VARCHAR(191) NOT NULL,
    `last_digit8` VARCHAR(191) NOT NULL,
    `last_digit9` VARCHAR(191) NOT NULL,
    `even` INTEGER NOT NULL,
    `odd` INTEGER NOT NULL,
    `hot` INTEGER NOT NULL,
    `warm` INTEGER NOT NULL,
    `cold` INTEGER NOT NULL,
    `low` INTEGER NOT NULL,
    `high` INTEGER NOT NULL,
    `ac` INTEGER NOT NULL,
    `consecutive` VARCHAR(191) NOT NULL,
    `pair` VARCHAR(191) NOT NULL,
    `prime` INTEGER NOT NULL,
    `composite` INTEGER NOT NULL,
    `mul3` INTEGER NOT NULL,
    `win1` INTEGER NOT NULL,
    `win2` INTEGER NOT NULL,
    `win3` INTEGER NOT NULL,
    `win4` INTEGER NOT NULL,
    `win5` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personal_prediction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitor_id` VARCHAR(191) NOT NULL,
    `episode` INTEGER NOT NULL,
    `pp1_wn_no` INTEGER NOT NULL,
    `pp2_wn_no` INTEGER NOT NULL,
    `pp3_wn_no` INTEGER NOT NULL,
    `pp4_wn_no` INTEGER NOT NULL,
    `pp5_wn_no` INTEGER NOT NULL,
    `pp6_wn_no` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `personal_analysis` ADD CONSTRAINT `personal_analysis_id_fkey` FOREIGN KEY (`id`) REFERENCES `personal_prediction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `personal_prediction` ADD CONSTRAINT `personal_prediction_episode_fkey` FOREIGN KEY (`episode`) REFERENCES `winning_number`(`episode`) ON DELETE RESTRICT ON UPDATE CASCADE;
