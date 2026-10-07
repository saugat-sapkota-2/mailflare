CREATE TABLE `mailbox_agent_settings` (`mailbox_id` text PRIMARY KEY NOT NULL REFERENCES `mailboxes`(`id`) ON DELETE cascade, `enabled` integer NOT NULL DEFAULT 1, `auto_draft_enabled` integer NOT NULL DEFAULT 0, `reviewer_user_id` text REFERENCES `users`(`id`) ON DELETE set null, `instructions` text NOT NULL DEFAULT '', `daily_limit` integer NOT NULL DEFAULT 25, `updated_at` integer NOT NULL);
--> statement-breakpoint
CREATE TABLE `agent_conversations` (`id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade, `mailbox_id` text NOT NULL REFERENCES `mailboxes`(`id`) ON DELETE cascade, `title` text NOT NULL DEFAULT 'New conversation', `created_at` integer NOT NULL, `updated_at` integer NOT NULL);
--> statement-breakpoint
CREATE INDEX `agent_conversations_owner_idx` ON `agent_conversations` (`user_id`, `mailbox_id`, `updated_at`);
--> statement-breakpoint
CREATE TABLE `agent_chat_messages` (`id` text PRIMARY KEY NOT NULL, `conversation_id` text NOT NULL REFERENCES `agent_conversations`(`id`) ON DELETE cascade, `role` text NOT NULL, `content` text NOT NULL, `tool_name` text, `created_at` integer NOT NULL);
--> statement-breakpoint
CREATE INDEX `agent_chat_messages_conversation_idx` ON `agent_chat_messages` (`conversation_id`, `created_at`);
--> statement-breakpoint
CREATE TABLE `agent_jobs` (`id` text PRIMARY KEY NOT NULL, `mailbox_id` text NOT NULL REFERENCES `mailboxes`(`id`) ON DELETE cascade, `source_message_id` text NOT NULL REFERENCES `messages`(`id`) ON DELETE cascade, `reviewer_user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade, `status` text NOT NULL DEFAULT 'pending', `attempts` integer NOT NULL DEFAULT 0, `next_attempt_at` integer NOT NULL, `lease_until` integer, `draft_id` text REFERENCES `messages`(`id`) ON DELETE set null, `reason` text, `created_at` integer NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_jobs_source_idx` ON `agent_jobs` (`mailbox_id`, `source_message_id`);
--> statement-breakpoint
CREATE INDEX `agent_jobs_due_idx` ON `agent_jobs` (`status`, `next_attempt_at`);
--> statement-breakpoint
CREATE TABLE `agent_draft_metadata` (`draft_id` text PRIMARY KEY NOT NULL REFERENCES `messages`(`id`) ON DELETE cascade, `mailbox_id` text NOT NULL REFERENCES `mailboxes`(`id`) ON DELETE cascade, `origin` text NOT NULL, `source_message_id` text REFERENCES `messages`(`id`) ON DELETE set null, `revision` integer NOT NULL DEFAULT 1, `human_edited_at` integer, `created_at` integer NOT NULL);
--> statement-breakpoint
CREATE TABLE `agent_send_approvals` (`id` text PRIMARY KEY NOT NULL, `draft_id` text NOT NULL REFERENCES `messages`(`id`) ON DELETE cascade, `mailbox_id` text NOT NULL REFERENCES `mailboxes`(`id`) ON DELETE cascade, `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade, `request_key_id` text REFERENCES `api_keys`(`id`) ON DELETE set null, `revision` integer NOT NULL, `payload_hash` text NOT NULL, `status` text NOT NULL DEFAULT 'pending', `claimed_at` integer, `message_id` text, `expires_at` integer NOT NULL, `created_at` integer NOT NULL);
--> statement-breakpoint
CREATE INDEX `agent_send_approvals_user_idx` ON `agent_send_approvals` (`user_id`, `status`);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_send_approvals_delivery_idx` ON `agent_send_approvals` (`draft_id`) WHERE `status` IN ('claimed', 'sent', 'unknown');
--> statement-breakpoint
CREATE TABLE `mcp_key_mailboxes` (`key_id` text NOT NULL REFERENCES `api_keys`(`id`) ON DELETE cascade, `mailbox_id` text NOT NULL REFERENCES `mailboxes`(`id`) ON DELETE cascade);
--> statement-breakpoint
CREATE UNIQUE INDEX `mcp_key_mailbox_idx` ON `mcp_key_mailboxes` (`key_id`, `mailbox_id`);
ALTER TABLE `api_keys` ADD `kind` text NOT NULL DEFAULT 'legacy';
--> statement-breakpoint
