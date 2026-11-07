CREATE TABLE `activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activity_at_idx` ON `activity_log` (`at`);--> statement-breakpoint
CREATE TABLE `admin_account` (
	`id` integer PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `brands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `closures` (
	`id` text PRIMARY KEY NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text DEFAULT '' NOT NULL,
	`reason` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_blocks` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fitting_offers` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gallery_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`src` text NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`universe` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`locked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`subject` text DEFAULT '' NOT NULL,
	`message` text NOT NULL,
	`read` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `messages_created_idx` ON `messages` (`created_at`);--> statement-breakpoint
CREATE TABLE `news` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`universe` text NOT NULL,
	`publish_date` text DEFAULT '' NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `news_publish_idx` ON `news` (`published`,`publish_date`);--> statement-breakpoint
CREATE TABLE `opening_hours` (
	`position` integer PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`slots` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `page_views` (
	`day` text NOT NULL,
	`path` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `path`)
);
--> statement-breakpoint
CREATE TABLE `quote_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quote_id` text NOT NULL,
	`at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quote_events_quote_idx` ON `quote_events` (`quote_id`,`at`);--> statement-breakpoint
CREATE TABLE `quote_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quote_id` text NOT NULL,
	`original_name` text NOT NULL,
	`stored_name` text NOT NULL,
	`size` integer NOT NULL,
	`mime_type` text NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quote_files_quote_idx` ON `quote_files` (`quote_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `quote_files_stored_idx` ON `quote_files` (`stored_name`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`ref` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`status` text DEFAULT 'nouveau' NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`reminder_date` text DEFAULT '' NOT NULL,
	`types` text NOT NULL,
	`details` text NOT NULL,
	`project_notes` text DEFAULT '' NOT NULL,
	`site` text NOT NULL,
	`contact` text NOT NULL,
	`pricing` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_ref_idx` ON `quotes` (`ref`);--> statement-breakpoint
CREATE INDEX `quotes_status_idx` ON `quotes` (`status`);--> statement-breakpoint
CREATE INDEX `quotes_created_idx` ON `quotes` (`created_at`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`author` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`rating` integer,
	`text` text NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `used_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`size` text DEFAULT '' NOT NULL,
	`condition` text DEFAULT '' NOT NULL,
	`price` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'dispo' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
