ALTER TABLE `source` ADD `key` text DEFAULT 'SCB' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `source_key_unique` ON `source` (`key`);