CREATE TABLE `daily_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_date` text NOT NULL,
	`items_json` text NOT NULL,
	`readiness_score` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_daily_plans_user_date` ON `daily_plans` (`user_id`,`plan_date`);--> statement-breakpoint
CREATE TABLE `daily_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`review_date` text NOT NULL,
	`win` text NOT NULL,
	`reflection` text NOT NULL,
	`evening_energy` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_daily_reviews_user_date` ON `daily_reviews` (`user_id`,`review_date`);