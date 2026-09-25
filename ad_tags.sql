-- MySQL Schema for Monetag Ad Tags in Gold Mailer
-- Table: ad_tags

CREATE TABLE IF NOT EXISTS `ad_tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tag_slot` VARCHAR(50) NOT NULL UNIQUE,
  `tag_code` MEDIUMTEXT DEFAULT NULL,
  `status` ENUM('connected', 'disconnected') NOT NULL DEFAULT 'disconnected',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial default slots for Tag 1 to Tag 5
INSERT INTO `ad_tags` (`tag_slot`, `tag_code`, `status`)
VALUES 
  ('Tag 1', '', 'disconnected'),
  ('Tag 2', '', 'disconnected'),
  ('Tag 3', '', 'disconnected'),
  ('Tag 4', '', 'disconnected'),
  ('Tag 5', '', 'disconnected')
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;
