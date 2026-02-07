PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_source` (
	`id` text PRIMARY KEY NOT NULL,
	`organization` text NOT NULL,
	`api_url` text NOT NULL,
	`description` text,
	`homepage_url` text,
	`category` text,
	`type` text,
	`queries` text,
	`trust_reason` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_source`("id", "organization", "api_url", "description", "homepage_url", "category", "type", "queries", "trust_reason", "is_enabled", "created_at", "updated_at") SELECT "id", "organization", "api_url", "description", "homepage_url", "category", "type", "queries", "trust_reason", "is_enabled", "created_at", "updated_at" FROM `source`;--> statement-breakpoint
DROP TABLE `source`;--> statement-breakpoint
ALTER TABLE `__new_source` RENAME TO `source`;--> statement-breakpoint
PRAGMA foreign_keys=ON;