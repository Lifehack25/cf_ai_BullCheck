PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_source` (
	`id` text PRIMARY KEY NOT NULL,
	`organization` text NOT NULL,
	`api_url` text NOT NULL,
	`description` text NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_source`("id", "organization", "api_url", "description", "is_enabled", "created_at", "updated_at") SELECT "id", "organization", "api_url", "description", "is_enabled", "created_at", "updated_at" FROM `source`;--> statement-breakpoint
DROP TABLE `source`;--> statement-breakpoint
ALTER TABLE `__new_source` RENAME TO `source`;--> statement-breakpoint
PRAGMA foreign_keys=ON;