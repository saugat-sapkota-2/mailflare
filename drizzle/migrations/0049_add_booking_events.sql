CREATE TABLE `booking_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
	`name` text NOT NULL,
	`slug` text NOT NULL DEFAULT '',
	`description` text NOT NULL DEFAULT '',
	`color` text NOT NULL DEFAULT '#2563eb',
	`host_ids` text NOT NULL DEFAULT '[]',
	`duration_minutes` integer NOT NULL,
	`location` text NOT NULL DEFAULT '',
	`weekdays` text NOT NULL DEFAULT '[1,2,3,4,5]',
	`start_time` text NOT NULL DEFAULT '09:00',
	`end_time` text NOT NULL DEFAULT '17:00',
	`time_ranges` text NOT NULL DEFAULT '[{"startTime":"09:00","endTime":"17:00"}]',
	`time_zone` text NOT NULL DEFAULT 'UTC',
	`enabled` integer NOT NULL DEFAULT 1,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
CREATE INDEX `booking_events_user_idx` ON `booking_events` (`user_id`);
CREATE UNIQUE INDEX `booking_events_user_slug_idx` ON `booking_events` (`user_id`, `slug`);
ALTER TABLE `users` ADD COLUMN `booking_username` text;
CREATE UNIQUE INDEX `users_booking_username_idx` ON `users` (`booking_username`);
