ALTER TABLE `calendar_events` ADD `repeat_days` text NOT NULL DEFAULT '[]';
ALTER TABLE `calendar_events` ADD `repeat_anchor_day` integer;
