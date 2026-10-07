ALTER TABLE app_settings ADD COLUMN outbound_attachment_max_mb integer NOT NULL DEFAULT 25;
CREATE TABLE shared_attachment_links (
	id text PRIMARY KEY NOT NULL,
	attachment_id text NOT NULL UNIQUE REFERENCES message_attachments(id) ON DELETE CASCADE,
	expires_at integer NOT NULL,
	created_at integer NOT NULL
);
