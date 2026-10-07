ALTER TABLE backup_settings ADD COLUMN excluded_table_groups text NOT NULL DEFAULT '[]';
