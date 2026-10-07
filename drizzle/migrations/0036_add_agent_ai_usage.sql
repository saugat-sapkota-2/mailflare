ALTER TABLE `app_settings` ADD `agent_model_rates` text;
CREATE TABLE `agent_ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`source` text NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`cost_usd_micros` integer
);
CREATE INDEX `agent_ai_usage_created_idx` ON `agent_ai_usage` (`created_at`);
