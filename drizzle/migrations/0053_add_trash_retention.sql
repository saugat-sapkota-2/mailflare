-- Optional per-user retention for Trash and Spam. `trashed_at` records when a
-- message entered either folder; triggers keep it current whichever code path
-- changes the status, and the scheduled purge deletes rows older than the
-- owner's `trash_retention_days` (NULL means keep forever).
ALTER TABLE `users` ADD `trash_retention_days` integer;--> statement-breakpoint
ALTER TABLE `messages` ADD `trashed_at` integer;--> statement-breakpoint
CREATE INDEX `messages_trashed_at_idx` ON `messages` (`trashed_at`);--> statement-breakpoint
UPDATE `messages` SET `trashed_at` = CAST(strftime('%s', 'now') AS integer) WHERE `status` IN ('trash', 'spam');--> statement-breakpoint
CREATE TRIGGER `messages_trashed_at_ai` AFTER INSERT ON `messages` WHEN new.`status` IN ('trash', 'spam') BEGIN
	UPDATE `messages` SET `trashed_at` = CAST(strftime('%s', 'now') AS integer) WHERE `rowid` = new.`rowid`;
END;--> statement-breakpoint
CREATE TRIGGER `messages_trashed_at_au` AFTER UPDATE OF `status` ON `messages` WHEN (new.`status` IN ('trash', 'spam')) <> (old.`status` IN ('trash', 'spam')) BEGIN
	UPDATE `messages` SET `trashed_at` = CASE WHEN new.`status` IN ('trash', 'spam') THEN CAST(strftime('%s', 'now') AS integer) ELSE NULL END WHERE `rowid` = new.`rowid`;
END;
