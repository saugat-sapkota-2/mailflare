ALTER TABLE `agent_ai_usage` RENAME TO `ai_usage`;
DROP INDEX `agent_ai_usage_created_idx`;
CREATE INDEX `ai_usage_created_idx` ON `ai_usage` (`created_at`);
