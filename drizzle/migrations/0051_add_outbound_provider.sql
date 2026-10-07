ALTER TABLE `domains` ADD `sending_provider` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
UPDATE `domains` SET `sending_provider` = 'cloudflare' WHERE `sending_requested` = 1 OR `sending_enabled` = 1 OR `sending_subdomain_tag` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `resend_api_key` text;
