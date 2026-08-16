-- AlterTable: add call-log support to Message
ALTER TABLE `Message`
  ADD COLUMN `type` ENUM('TEXT', 'CALL') NOT NULL DEFAULT 'TEXT',
  ADD COLUMN `callType` ENUM('AUDIO', 'VIDEO') NULL,
  ADD COLUMN `callStatus` ENUM('COMPLETED', 'MISSED', 'REJECTED', 'CANCELLED', 'BUSY') NULL,
  ADD COLUMN `callDuration` INTEGER NULL;
