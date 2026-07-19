-- 1. Rename the main table
RENAME TABLE `visitor` TO `user`;

-- 2. Rename columns in related tables
ALTER TABLE `block` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `comment_like` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `comment_report` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `hon` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `hon_event` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `inquiry` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `notification` CHANGE `visitorId` `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `payment_projection` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `personal_prediction` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `post` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `post_comment` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `post_like` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `post_report` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `prediction` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;
ALTER TABLE `subscription` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;

-- 3. Create the newly added tables (login_fail_log, privacy_policy, terms_of_service)
CREATE TABLE `login_fail_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ip` VARCHAR(191) NOT NULL,
    `fail_count` INTEGER NOT NULL DEFAULT 1,
    `last_failed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `privacy_policy` (
    `id` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `terms_of_service` (
    `id` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
