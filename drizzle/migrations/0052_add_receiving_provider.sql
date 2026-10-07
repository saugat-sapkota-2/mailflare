ALTER TABLE `domains` ADD `receiving_provider` text DEFAULT 'cloudflare' NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `aws_config` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `ses_receiving` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `resend_webhook_id` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `resend_webhook_secret` text;
