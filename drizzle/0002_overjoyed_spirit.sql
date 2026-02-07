DROP TABLE `chat`;--> statement-breakpoint
DROP TABLE `message`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_source` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`url` text,
	`title` text,
	`snippet` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_source`("id", "user_id", "url", "title", "snippet", "created_at") SELECT "id", "user_id", "url", "title", "snippet", "created_at" FROM `source`;--> statement-breakpoint
DROP TABLE `source`;--> statement-breakpoint
ALTER TABLE `__new_source` RENAME TO `source`;--> statement-breakpoint
PRAGMA foreign_keys=ON;