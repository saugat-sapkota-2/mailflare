ALTER TABLE `calendar_events` ADD `repeat` text NOT NULL DEFAULT 'none';
ALTER TABLE `calendar_events` ADD `repeat_until` integer;
