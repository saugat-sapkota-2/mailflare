import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { permanentlyDeleteMessages } from "@/lib/email/permanent-delete";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import { isPermanentDeleteFolder } from "../bulk/utils";
import type { EmptyFolderPayload } from "./types";
import { EMPTY_FOLDER_BATCH_SIZE } from "./utils";

/**
 * Permanently delete everything in a mailbox's Trash or Spam. Work is done in
 * batches so a large folder stays within one Worker invocation's limits; the
 * response reports what is left and the client calls again until it is zero.
 */
export async function POST(request: Request) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = (await request.json().catch(() => ({}))) as EmptyFolderPayload;
	if (!payload.mailboxId || !isPermanentDeleteFolder(payload.folder)) {
		return NextResponse.json({ error: "A mailbox and a Trash or Spam folder are required" }, { status: 400 });
	}

	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, payload.mailboxId);
	if (!access?.canManage) {
		return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
	}

	const inFolder = and(eq(messages.mailboxId, payload.mailboxId), eq(messages.status, payload.folder));
	const batch = await db
		.select({ id: messages.id, mailboxId: messages.mailboxId, rawR2Key: messages.rawR2Key, status: messages.status })
		.from(messages)
		.where(inFolder)
		.limit(EMPTY_FOLDER_BATCH_SIZE);
	const deleted = await permanentlyDeleteMessages(env, db, user.id, batch, "empty");
	const [left] = await db.select({ n: count() }).from(messages).where(inFolder);

	return NextResponse.json({ ok: true, deleted, remaining: left?.n ?? 0 });
}
