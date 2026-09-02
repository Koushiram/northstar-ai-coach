CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`category` text DEFAULT 'Other' NOT NULL,
	`note` text DEFAULT 'Expense' NOT NULL,
	`spent_on` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_expenses_user_date` ON `expenses` (`user_id`,`spent_on`);--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`area` text DEFAULT 'Personal' NOT NULL,
	`target_value` integer DEFAULT 100 NOT NULL,
	`current_value` integer DEFAULT 0 NOT NULL,
	`unit` text DEFAULT '%' NOT NULL,
	`target_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_goals_user_status` ON `goals` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `health_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`log_date` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`duration_minutes` integer,
	`calories` integer,
	`protein_grams` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_health_logs_user_date_kind` ON `health_logs` (`user_id`,`log_date`,`kind`);--> statement-breakpoint
CREATE TABLE `money_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text DEFAULT 'Main balance' NOT NULL,
	`balance_cents` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'AUD' NOT NULL,
	`monthly_budget_cents` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_money_accounts_user` ON `money_accounts` (`user_id`);
--> statement-breakpoint
PRAGMA optimize;
