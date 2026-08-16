-- Website page / section composition CMS

CREATE TABLE `WebsitePage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `path` VARCHAR(191) NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WebsitePage_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PageSection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pageId` INTEGER NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `subtitle` TEXT NULL,
    `content` TEXT NULL,
    `image` VARCHAR(191) NULL,
    `buttonText` VARCHAR(191) NULL,
    `buttonLink` VARCHAR(191) NULL,
    `config` JSON NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PageSection_pageId_order_idx`(`pageId`, `order`),
    INDEX `PageSection_isActive_idx`(`isActive`),
    UNIQUE INDEX `PageSection_pageId_key_key`(`pageId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PageSection` ADD CONSTRAINT `PageSection_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `WebsitePage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
