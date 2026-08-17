CREATE TABLE `support_conversations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `chatId` INT NOT NULL,
  `customerId` INT NOT NULL,
  `assignedToId` INT NULL,
  `propertyId` INT NULL,
  `bookingId` INT NULL,
  `type` VARCHAR(32) NOT NULL DEFAULT 'CUSTOMER_SUPPORT',
  `status` VARCHAR(16) NOT NULL DEFAULT 'OPEN',
  `subject` VARCHAR(255) NULL,
  `customerUnreadCount` INT NOT NULL DEFAULT 0,
  `staffUnreadCount` INT NOT NULL DEFAULT 0,
  `assignedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `support_conversations_chatId_key` (`chatId`),
  KEY `support_conversations_customerId_idx` (`customerId`),
  KEY `support_conversations_assignedToId_idx` (`assignedToId`),
  KEY `support_conversations_propertyId_idx` (`propertyId`),
  KEY `support_conversations_bookingId_idx` (`bookingId`),
  KEY `support_conversations_status_updatedAt_idx` (`status`, `updatedAt`),
  CONSTRAINT `support_conversations_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `support_conversations_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `support_conversations_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `support_conversations_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `support_conversations_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `support_message_meta` (
  `messageId` INT NOT NULL,
  `attachments` JSON NULL,
  `readReceipts` JSON NULL,
  `isInternal` BOOLEAN NOT NULL DEFAULT FALSE,
  `deletedAt` DATETIME(3) NULL,
  `editedAt` DATETIME(3) NULL,
  PRIMARY KEY (`messageId`),
  KEY `support_message_meta_isInternal_idx` (`isInternal`),
  CONSTRAINT `support_message_meta_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `support_notes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `conversationId` INT NOT NULL,
  `authorId` INT NOT NULL,
  `body` TEXT NOT NULL,
  `pinned` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `support_notes_conversationId_createdAt_idx` (`conversationId`, `createdAt`),
  KEY `support_notes_authorId_idx` (`authorId`),
  CONSTRAINT `support_notes_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `support_conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `support_notes_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
