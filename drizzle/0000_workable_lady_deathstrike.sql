CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`mechanical_version` integer NOT NULL,
	`created_at` text NOT NULL,
	`legend_a` text NOT NULL,
	`legend_b` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_matches_source_created_at` ON `matches` (`source`,`created_at`);--> statement-breakpoint
CREATE TABLE `usage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_usage_events_created_at` ON `usage_events` (`created_at`);