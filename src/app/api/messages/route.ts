import { NextResponse } from "next/server";
import { eq, desc, and, like, or, count, isNull, inArray, lte, gt } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { getContactDisplayNameMap } from "@/lib/contacts/service";
import { normalizeEmailAddress } from "@/lib/email/address";
import { buildSnippet } from "@/lib/email/parse";
import { getMailboxAccessLevel, listAccessibleMailboxes } from "@/lib/mailboxes/access";

export async function GET(request: Request) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(request.url);
	const direction = url.searchParams.get("direction");
	const mailboxId = url.searchParams.get("mailboxId");
	const folderId = url.searchParams.get("folderId");
	const status = url.searchParams.get("status");
	const query = url.searchParams.get("q")?.trim();
	const title = url.searchParams.get("title")?.trim();
	const read = url.searchParams.get("read");
	const starred = url.searchParams.get("starred");
	const snoozed = url.searchParams.get("snoozed");
	const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
	const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

	const db = getDb(env);
	const accessibleMailboxes = await listAccessibleMailboxes(db, user);
	const accessibleMailboxIds = accessibleMailboxes.map((mailbox) => mailbox.id);
	const conditions: SQL[] = [];
	if (mailboxId) {
		const access = await getMailboxAccessLevel(db, user, mailboxId);
		if (!access?.canRead) {
			return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
		}
		conditions.push(eq(messages.mailboxId, mailboxId));
	} else if (accessibleMailboxIds.length > 0) {
		conditions.push(inArray(messages.mailboxId, accessibleMailboxIds));
	} else {
		conditions.push(eq(messages.userId, user.id));
	}
	if (direction === "inbound" || direction === "outbound") {
		conditions.push(eq(messages.direction, direction));
	}
	if (folderId) {
		conditions.push(eq(messages.folderId, folderId));
	}
	if (status) {
		conditions.push(eq(messages.status, status));
	}
	if (status === "received" && !folderId) {
		conditions.push(isNull(messages.folderId));
		conditions.push(or(isNull(messages.snoozedUntil), lte(messages.snoozedUntil, new Date()))!);
	}
	if (starred === "true") {
		conditions.push(eq(messages.starred, true));
	}
	if (snoozed === "true") {
		conditions.push(eq(messages.status, "received"));
		conditions.push(isNull(messages.folderId));
		conditions.push(gt(messages.snoozedUntil, new Date()));
	}
	if (read === "read") {
		conditions.push(eq(messages.read, true));
	}
	if (read === "unread") {
		conditions.push(eq(messages.read, false));
	}
	if (query) {
		const pattern = `%${query}%`;
		const queryCondition = or(
			like(messages.fromAddr, pattern),
			like(messages.toAddr, pattern),
			like(messages.subject, pattern),
			like(messages.snippet, pattern),
		);
		if (queryCondition) conditions.push(queryCondition);
	}
	if (title) {
		conditions.push(like(messages.subject, `%${title}%`));
	}
	const where = and(...conditions);

	const [totalRow] = await db
		.select({ total: count() })
		.from(messages)
		.where(where);
	const rows = await db
		.select()
		.from(messages)
		.where(where)
		.orderBy(desc(messages.createdAt))
		.limit(limit)
		.offset(offset);
	const mailboxNameMap = new Map(
		accessibleMailboxes.map((mailbox) => [
			mailbox.id,
			mailbox.displayName ?? mailbox.localPart,
		]),
	);
	const contactMapsByUserId = new Map(
		await Promise.all(
			Array.from(new Set(rows.map((message) => message.userId))).map(async (userId) => [
				userId,
				await getContactDisplayNameMap(
					env,
					userId,
					rows
						.filter((message) => message.userId === userId)
						.flatMap((message) => [message.fromAddr, message.toAddr]),
				),
			] as const),
		),
	);
	const enrichedRows = rows.map(({ rawR2Key: _rawR2Key, ...message }) => {
		const contactMap = contactMapsByUserId.get(message.userId);
		const accountName = message.mailboxId ? mailboxNameMap.get(message.mailboxId) : null;
		return {
			...message,
			snippet: buildSnippet(message.textBody, message.htmlBody) || message.snippet,
			fromContactName:
				(message.direction === "outbound" ? accountName : null) ??
				contactMap?.get(normalizeEmailAddress(message.fromAddr)) ??
				null,
			toContactName: contactMap?.get(normalizeEmailAddress(message.toAddr)) ?? null,
		};
	});

	return NextResponse.json({ messages: enrichedRows, total: totalRow?.total ?? 0, limit, offset });
}
