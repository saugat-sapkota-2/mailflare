import { inArray } from "drizzle-orm";
import { jmapMailboxRevisions } from "@/db/schema";
import { listJmapMailboxes } from "./access";
import type { JmapContext } from "./types";

/** A cheap change signal for the stream; every message and folder write bumps a mailbox revision. */
export async function getJmapRevision(ctx: JmapContext): Promise<string> {
	const mailboxes = await listJmapMailboxes(ctx);
	const ids = mailboxes.map((mailbox) => mailbox.id);
	if (ids.length === 0) return "[]";
	const revisions = new Map<string, number>();
	for (let offset = 0; offset < ids.length; offset += 100) {
		const rows = await ctx.db
			.select({ mailboxId: jmapMailboxRevisions.mailboxId, revision: jmapMailboxRevisions.revision })
			.from(jmapMailboxRevisions)
			.where(inArray(jmapMailboxRevisions.mailboxId, ids.slice(offset, offset + 100)));
		for (const row of rows) revisions.set(row.mailboxId, row.revision);
	}
	return JSON.stringify(mailboxes.map((mailbox) => [mailbox.id, mailbox.permission, mailbox.localPart, mailbox.hostname, mailbox.displayName, revisions.get(mailbox.id) ?? 0]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}
