-- CreateTable
CREATE TABLE `payment_event` (
    `id` VARCHAR(191) NOT NULL,
    `payment_id` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_event_payment_id_idx`(`payment_id`),
    UNIQUE INDEX `payment_event_payment_id_version_key`(`payment_id`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_projection` (
    `payment_id` VARCHAR(191) NOT NULL,
    `visitor_id` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `order_name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `payment_key` VARCHAR(191) NULL,
    `fail_reason` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_projection_order_id_key`(`order_id`),
    INDEX `payment_projection_visitor_id_idx`(`visitor_id`),
    PRIMARY KEY (`payment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hon` (
    `visitor_id` VARCHAR(191) NOT NULL,
    `balance` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`visitor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription` (
    `visitor_id` VARCHAR(191) NOT NULL,
    `plan` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `billing_key` VARCHAR(191) NOT NULL,
    `next_payment_at` DATETIME(3) NOT NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`visitor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `hon` ADD CONSTRAINT `hon_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription` ADD CONSTRAINT `subscription_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
