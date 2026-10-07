import { and, eq, inArray, isNotNull, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { messages, users } from "@/db/schema";
import { permanentlyDeleteMessages } from "@/lib/email/permanent-delete";
import { TRASH_RETENTION_BATCH_SIZE, getTrashRetentionCutoff, normalizeTrashRetentionDays } from "./trash-retention-utils";

/**
 * Permanently delete Trash and Spam messages that have been there longer than
 * their owner's retention setting. Runs from the scheduled handler; each run
 * removes at most one batch, so a large backlog drains over several runs.
 */
export async function runTrashRetention(env: CloudflareEnv, now = new Date()): Promise<number> {
	const db = getDb(env);
	const owners = await db
		.select({ id: users.id, days: users.trashRetentionDays })
		.from(users)
		.where(isNotNull(users.trashRetentionDays));

	let budget = TRASH_RETENTION_BATCH_SIZE;
	let deleted = 0;
	for (const owner of owners) {
		const days = normalizeTrashRetentionDays(owner.days);
		if (!days || budget <= 0) continue;
		const expired = await db
			.select({ id: messages.id, mailboxId: messages.mailboxId, rawR2Key: messages.rawR2Key, status: messages.status })
			.from(messages)
			.where(and(
				eq(messages.userId, owner.id),
				inArray(messages.status, ["trash", "spam"]),
				lt(messages.trashedAt, getTrashRetentionCutoff(now, days)),
			))
			.limit(budget);
		if (expired.length === 0) continue;
		deleted += await permanentlyDeleteMessages(env, db, owner.id, expired, "retention");
		budget -= expired.length;
	}
	return deleted;
}
