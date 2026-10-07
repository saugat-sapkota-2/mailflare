import type { MailboxRevisionRow } from "./types";

/** Covers every mailbox visible to a user, including shared mailboxes. */
export async function getUserMailRevision(env: CloudflareEnv, userId: string): Promise<string> {
	const result = await env.DB.prepare(`
		SELECT m.id AS mailbox_id, COALESCE(r.revision, 0) AS revision, 'owner' AS permission
		FROM mailboxes m
		LEFT JOIN jmap_mailbox_revisions r ON r.mailbox_id = m.id
		WHERE m.user_id = ? AND m.disabled = 0
		UNION
		SELECT m.id AS mailbox_id, COALESCE(r.revision, 0) AS revision, a.permission AS permission
		FROM mailbox_access a
		JOIN mailboxes m ON m.id = a.mailbox_id
		LEFT JOIN jmap_mailbox_revisions r ON r.mailbox_id = m.id
		WHERE a.user_id = ? AND m.type = 'shared' AND m.disabled = 0
		ORDER BY mailbox_id, permission
	`).bind(userId, userId).all<MailboxRevisionRow>();
	return JSON.stringify(result.results.map((row) => [row.mailbox_id, row.revision, row.permission]));
}
