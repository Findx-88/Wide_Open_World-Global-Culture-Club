CREATE TABLE `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`member_id` integer,
	`display_name` text NOT NULL,
	`email` text,
	`joined_at` text,
	`left_at` text,
	`minutes` integer DEFAULT 0 NOT NULL,
	`source` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `attendance_event_idx` ON `attendance` (`event_id`);--> statement-breakpoint
CREATE INDEX `attendance_member_idx` ON `attendance` (`member_id`);--> statement-breakpoint
CREATE TABLE `confirmation_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`expedition_id` integer NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`sent_count` integer DEFAULT 0 NOT NULL,
	`first_sent_at` text,
	`last_sent_at` text,
	`answered_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`expedition_id`) REFERENCES `expeditions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `confirmation_requests_token_unique` ON `confirmation_requests` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `confirmation_member_expedition_idx` ON `confirmation_requests` (`member_id`,`expedition_id`);--> statement-breakpoint
CREATE TABLE `email_outbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer,
	`to_email` text NOT NULL,
	`type` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`subject` text NOT NULL,
	`body_html` text NOT NULL,
	`body_text` text NOT NULL,
	`send_at` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`error` text,
	`sent_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_outbox_dedupe_key_unique` ON `email_outbox` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `outbox_status_idx` ON `email_outbox` (`status`,`send_at`);--> statement-breakpoint
CREATE TABLE `notification_prefs` (
	`member_id` integer PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`unsubscribed_all` integer DEFAULT false NOT NULL,
	`disabled_types` text DEFAULT '[]' NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_prefs_token_unique` ON `notification_prefs` (`token`);--> statement-breakpoint
CREATE TABLE `participation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`expedition_id` integer NOT NULL,
	`kind` text NOT NULL,
	`work_id` integer,
	`target_key` text NOT NULL,
	`status` text DEFAULT 'unconfirmed' NOT NULL,
	`source` text DEFAULT 'member' NOT NULL,
	`note` text,
	`answered_at` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`expedition_id`) REFERENCES `expeditions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participation_member_target_idx` ON `participation` (`member_id`,`target_key`);--> statement-breakpoint
CREATE INDEX `participation_expedition_idx` ON `participation` (`expedition_id`);--> statement-breakpoint
CREATE TABLE `visa_awards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`expedition_id` integer NOT NULL,
	`kind` text NOT NULL,
	`work_id` integer,
	`target_key` text NOT NULL,
	`reason` text NOT NULL,
	`source` text NOT NULL,
	`awarded_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')) NOT NULL,
	`awarded_by` integer,
	`revoked_at` text,
	`revoked_reason` text,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`expedition_id`) REFERENCES `expeditions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`awarded_by`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `visa_award_member_target_idx` ON `visa_awards` (`member_id`,`target_key`);--> statement-breakpoint
CREATE INDEX `visa_award_expedition_idx` ON `visa_awards` (`expedition_id`);--> statement-breakpoint
ALTER TABLE `events` ADD `zoom_meeting_id` text;--> statement-breakpoint
ALTER TABLE `expedition_works` ADD `awards_visa` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `expeditions` ADD `class_visa_evidence` text DEFAULT 'any' NOT NULL;--> statement-breakpoint
ALTER TABLE `expeditions` ADD `class_visa_min_sessions` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `expeditions` ADD `movie_visa_min_films` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `expeditions` ADD `confirmations_opened_at` text;
--> statement-breakpoint
INSERT INTO visa_awards (member_id, expedition_id, kind, target_key, reason, source, awarded_at) SELECT member_id, expedition_id, 'legacy', 'legacy:' || expedition_id, 'Legacy visa granted before verification existed — not confirmed by the member or by attendance data.', 'legacy', issued_at FROM visas;
