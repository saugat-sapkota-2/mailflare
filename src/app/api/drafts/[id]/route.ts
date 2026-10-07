import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { getDb } from "@/db";
import { agentDraftMetadata, messages } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { buildSnippet } from "@/lib/email/parse";
import type { DraftPayload, DraftRouteParams } from "./types";
import { selectDraftWithBody } from "./utils";
import { readJsonBody } from "@/lib/http/request";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { getDraftSender, userOwnsDraft } from "../utils";
import { listMessageAttachments } from "@/lib/email/attachments";
import { deleteMessageWithObjects } from "@/lib/email/message-cleanup";
import { parseAgentScheduledAt } from "@/lib/agent/schedule";

export async function GET(request: Request, { params }: DraftRouteParams) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	const db = getDb(env);
	const draft = await selectDraftWithBody(db, user.id, id);

	if (!draft) {
		return NextResponse.json({ error: "Draft not found" }, { status: 404 });
	}

	const attachments = await listMessageAttachments(env, id);
	const [agent] = await db.select().from(agentDraftMetadata).where(eq(agentDraftMetadata.draftId, id)).limit(1);
	return NextResponse.json({ draft: { ...draft, attachments, agent: agent ? { revision: agent.revision, origin: agent.origin, scheduledAt: agent.scheduledAt?.toISOString() ?? null } : null } });
}

export async function PATCH(request: Request, { params }: DraftRouteParams) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	let input: DraftPayload;
	try {
		input = await readJsonBody<DraftPayload>(request, 1024 * 1024);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: "Invalid draft request" }, { status });
	}
	const db = getDb(env);
	const [draft] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);

	if (!userOwnsDraft(draft, user.id)) {
		return NextResponse.json({ error: "Draft not found" }, { status: 404 });
	}
	const [agent] = await db.select({ mailboxId: agentDraftMetadata.mailboxId }).from(agentDraftMetadata).where(eq(agentDraftMetadata.draftId, id)).limit(1);
	if (agent && input.mailboxId !== agent.mailboxId) {
		return NextResponse.json({ error: "Agent draft mailbox cannot be changed" }, { status: 409 });
	}
	let scheduledAt: Date | null | undefined;
	if (agent && input.scheduledAt !== undefined) {
		try { scheduledAt = parseAgentScheduledAt(input.scheduledAt); }
		catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid schedule" }, { status: 400 }); }
	}
	const sender = await getDraftSender(env, user.id, input);
	if ("error" in sender) {
		return NextResponse.json({ error: sender.error }, { status: 403 });
	}

	const text = input.text ?? "";
	const html = input.html ?? "";
	await db
		.update(messages)
		.set({
			mailboxId: sender.mailboxId,
			fromAddr: sender.fromAddr,
			toAddr: input.to ?? "",
			ccAddr: input.cc || null,
			bccAddr: input.bcc || null,
			subject: input.subject ?? null,
			snippet: buildSnippet(text || null, html || null),
			textBody: text || null,
			htmlBody: html || null,
		})
		.where(eq(messages.id, id));
	await db.update(agentDraftMetadata).set({ revision: sql`${agentDraftMetadata.revision} + 1`, humanEditedAt: new Date(), ...(scheduledAt !== undefined ? { scheduledAt } : {}) }).where(eq(agentDraftMetadata.draftId, id));

	return NextResponse.json({ draft: { id } });
}

export async function DELETE(request: Request, { params }: DraftRouteParams) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	const db = getDb(env);
	const [draft] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);

	if (!userOwnsDraft(draft, user.id)) {
		return NextResponse.json({ error: "Draft not found" }, { status: 404 });
	}

	await deleteMessageWithObjects(env, db, id, draft.rawR2Key);
	return NextResponse.json({ ok: true });
}
