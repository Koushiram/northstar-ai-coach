CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`meta` text DEFAULT 'Personal · 30 min' NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tasks_user_id_id` ON `tasks` (`user_id`,`id`);--> statement-breakpoint
CREATE TABLE `wellbeing_checkins` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`checkin_date` text NOT NULL,
	`sleep_minutes` integer,
	`energy` integer,
	`mood` integer,
	`soreness` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_checkins_user_date` ON `wellbeing_checkins` (`user_id`,`checkin_date`);