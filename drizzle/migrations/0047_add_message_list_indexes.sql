-- Inbox list and conversation view. The page walk is
-- ORDER BY created_at DESC, id DESC filtered by mailbox, status, and folder.
-- Conversation grouping keys off coalesce(thread_id, id). Without these,
-- both plans sort or scan the whole mailbox.
CREATE INDEX IF NOT EXISTS `messages_inbox_page_idx` ON `messages` (`mailbox_id`, `status`, `folder_id`, `created_at` DESC, `id` DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `messages_thread_key_idx` ON `messages` (`mailbox_id`, `status`, `folder_id`, coalesce(`thread_id`, `id`), `created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `messages_mailbox_thread_key_idx` ON `messages` (`mailbox_id`, coalesce(`thread_id`, `id`));
