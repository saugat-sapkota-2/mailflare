import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { newId } from "@/lib/ids";
import { buildSnippet } from "@/lib/email/parse";
import { readJsonBody } from "@/lib/http/request";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import type { DraftPayload } from "./types";
import { getDraftSender } from "./utils";

export async function GET(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const url = new URL(request.url);
	const mailboxId = url.searchParams.get("mailboxId");
	const db = getDb(env);
	const conditions = [
		eq(messages.userId, user.id),
		eq(messages.direction, "outbound" as const),
		eq(messages.status, "draft"),
	];
	if (mailboxId) conditions.push(eq(messages.mailboxId, mailboxId));

	const rows = await db
		.select()
		.from(messages)
		.where(and(...conditions))
		.orderBy(desc(messages.createdAt))
		.limit(100);

	return NextResponse.json({ drafts: rows });
}

export async function POST(request: Request) {
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
	const sender = await getDraftSender(env, user.id, input);
	if ("error" in sender) {
		return NextResponse.json({ error: sender.error }, { status: 403 });
	}
	const draftId = newId("msg");
	const text = input.text ?? "";
	const html = input.html ?? "";

	await db.insert(messages).values({
		id: draftId,
		userId: user.id,
		mailboxId: sender.mailboxId,
		direction: "outbound",
		fromAddr: sender.fromAddr,
		toAddr: input.to ?? "",
		subject: input.subject ?? null,
		snippet: buildSnippet(text || null, html || null),
		textBody: text || null,
		htmlBody: html || null,
		status: "draft",
		read: true,
	});

	return NextResponse.json({ draft: { id: draftId } });
}
