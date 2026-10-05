CREATE TABLE `admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`last_login_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_unique` ON `admins` (`email`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_id` integer,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`detail` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`iso2` text PRIMARY KEY NOT NULL,
	`iso3` text NOT NULL,
	`name` text NOT NULL,
	`capital` text,
	`currency` text,
	`languages` text,
	`continent` text NOT NULL,
	`lat` real,
	`lng` real,
	`utc_offset` real,
	`epithet` text
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`expedition_id` integer,
	`kind` text DEFAULT 'meeting' NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`starts_at` text NOT NULL,
	`duration_min` integer DEFAULT 90 NOT NULL,
	`host_timezone` text DEFAULT 'Asia/Kolkata' NOT NULL,
	`join_url` text,
	`recording_url` text,
	`published` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	FOREIGN KEY (`expedition_id`) REFERENCES `expeditions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `events_starts_idx` ON `events` (`starts_at`);--> statement-breakpoint
CREATE TABLE `expedition_friends` (
	`expedition_id` integer NOT NULL,
	`friend_id` integer NOT NULL,
	`quote` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`expedition_id`, `friend_id`),
	FOREIGN KEY (`expedition_id`) REFERENCES `expeditions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`friend_id`) REFERENCES `friends`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `expedition_works` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`expedition_id` integer NOT NULL,
	`work_id` integer NOT NULL,
	`role` text DEFAULT 'primary' NOT NULL,
	`category` text,
	`why_chosen` text,
	`quote` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`expedition_id`) REFERENCES `expeditions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `expedition_work_idx` ON `expedition_works` (`expedition_id`,`work_id`);--> statement-breakpoint
CREATE TABLE `expeditions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`number` integer NOT NULL,
	`country_iso2` text NOT NULL,
	`tagline` text,
	`description` text,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	`hero_image_url` text,
	`hero_title` text,
	`hero_caption` text,
	`hero_credit` text,
	`accent_color` text DEFAULT '#C9A052' NOT NULL,
	`pattern` text DEFAULT 'none' NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	FOREIGN KEY (`country_iso2`) REFERENCES `countries`(`iso2`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `expeditions_slug_unique` ON `expeditions` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `expeditions_number_unique` ON `expeditions` (`number`);--> statement-breakpoint
CREATE TABLE `friends` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`title` text,
	`bio` text,
	`photo_url` text,
	`location` text,
	`country_iso2` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	FOREIGN KEY (`country_iso2`) REFERENCES `countries`(`iso2`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friends_slug_unique` ON `friends` (`slug`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`passport_number` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`country_iso2` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`joined_on` text NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	FOREIGN KEY (`country_iso2`) REFERENCES `countries`(`iso2`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_passport_number_unique` ON `members` (`passport_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE INDEX `members_status_idx` ON `members` (`status`);--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`country` text NOT NULL,
	`book_title` text,
	`book_author` text,
	`film_title` text,
	`film_director` text,
	`submitter_name` text,
	`why` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`expedition_id` integer NOT NULL,
	`issued_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	`issued_by` integer,
	`source` text DEFAULT 'admin' NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`expedition_id`) REFERENCES `expeditions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`issued_by`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `visa_member_expedition_idx` ON `visas` (`member_id`,`expedition_id`);--> statement-breakpoint
CREATE TABLE `works` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`creator` text NOT NULL,
	`year` integer,
	`length` integer,
	`genre` text,
	`description` text,
	`cover_url` text,
	`awards` text DEFAULT '[]' NOT NULL,
	`country_iso2` text,
	`in_library` integer DEFAULT true NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	FOREIGN KEY (`country_iso2`) REFERENCES `countries`(`iso2`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `works_country_idx` ON `works` (`country_iso2`);--> statement-breakpoint
CREATE UNIQUE INDEX `works_identity_idx` ON `works` (`kind`,`title`,`creator`);