CREATE TABLE `health_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`daily_calories` integer DEFAULT 2200 NOT NULL,
	`daily_protein_grams` integer DEFAULT 120 NOT NULL,
	`daily_water_ml` integer DEFAULT 2500 NOT NULL,
	`daily_steps` integer DEFAULT 8000 NOT NULL,
	`weekly_workouts` integer DEFAULT 4 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_health_targets_user` ON `health_targets` (`user_id`);
--> statement-breakpoint
PRAGMA optimize;
