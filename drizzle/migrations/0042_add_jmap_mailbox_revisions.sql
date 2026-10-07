CREATE TABLE `jmap_mailbox_revisions` (
	`mailbox_id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL DEFAULT 0
);

CREATE INDEX `mailboxes_user_idx` ON `mailboxes` (`user_id`);

CREATE TRIGGER `jmap_messages_ai` AFTER INSERT ON `messages`
WHEN NEW.mailbox_id IS NOT NULL BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (NEW.mailbox_id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;

CREATE TRIGGER `jmap_messages_au` AFTER UPDATE ON `messages`
WHEN NEW.mailbox_id IS NOT NULL BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (NEW.mailbox_id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;

CREATE TRIGGER `jmap_messages_au_old` AFTER UPDATE OF mailbox_id ON `messages`
WHEN OLD.mailbox_id IS NOT NULL AND OLD.mailbox_id IS NOT NEW.mailbox_id BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (OLD.mailbox_id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;

CREATE TRIGGER `jmap_messages_ad` AFTER DELETE ON `messages`
WHEN OLD.mailbox_id IS NOT NULL BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (OLD.mailbox_id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;

CREATE TRIGGER `jmap_folders_ai` AFTER INSERT ON `folders` BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (NEW.mailbox_id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;

CREATE TRIGGER `jmap_folders_au` AFTER UPDATE ON `folders` BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (NEW.mailbox_id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;

CREATE TRIGGER `jmap_folders_au_old` AFTER UPDATE OF mailbox_id ON `folders`
WHEN OLD.mailbox_id IS NOT NEW.mailbox_id BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (OLD.mailbox_id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;

CREATE TRIGGER `jmap_folders_ad` AFTER DELETE ON `folders` BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (OLD.mailbox_id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;

CREATE TRIGGER `jmap_mailboxes_au` AFTER UPDATE ON `mailboxes` BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (NEW.id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;

CREATE TRIGGER `jmap_mailbox_aliases_ai` AFTER INSERT ON `mailbox_aliases` BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (NEW.mailbox_id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;

CREATE TRIGGER `jmap_mailbox_aliases_au` AFTER UPDATE ON `mailbox_aliases` BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (NEW.mailbox_id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;

CREATE TRIGGER `jmap_mailbox_aliases_au_old` AFTER UPDATE OF mailbox_id ON `mailbox_aliases`
WHEN OLD.mailbox_id IS NOT NEW.mailbox_id BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (OLD.mailbox_id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;

CREATE TRIGGER `jmap_mailbox_aliases_ad` AFTER DELETE ON `mailbox_aliases` BEGIN
	INSERT INTO jmap_mailbox_revisions (mailbox_id, revision) VALUES (OLD.mailbox_id, 1)
	ON CONFLICT(mailbox_id) DO UPDATE SET revision = revision + 1;
END;
