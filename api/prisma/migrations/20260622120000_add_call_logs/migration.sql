-- AddCallLog
CREATE TABLE `CallLog` (
    `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    `chatId` INTEGER NOT NULL,
    `callerId` INTEGER NOT NULL,
    `receiverId` INTEGER NOT NULL,
    `callType` VARCHAR(191) NOT NULL DEFAULT 'audio',
    `status` VARCHAR(191) NOT NULL DEFAULT 'missed',
    `duration` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `endedAt` DATETIME NULL,
    FOREIGN KEY (`chatId`) REFERENCES `Chat` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`callerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`receiverId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX `CallLog_chatId_idx` ON `CallLog`(`chatId`);
CREATE INDEX `CallLog_callerId_idx` ON `CallLog`(`callerId`);
CREATE INDEX `CallLog_receiverId_idx` ON `CallLog`(`receiverId`);
CREATE INDEX `CallLog_startedAt_idx` ON `CallLog`(`startedAt`);