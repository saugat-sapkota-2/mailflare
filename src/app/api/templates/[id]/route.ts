import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { messages } from "@/db/schema";
import { requireSessionUser } from "@/lib/api/auth";
import { hasValidSessionMutationOrigin } from "@/lib/auth/origin";
import { getEnv } from "@/lib/cloudflare";
import { deleteMessageWithObjects } from "@/lib/email/message-cleanup";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	if (!hasValidSessionMutationOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
	const { id } = await params;
	const db = getDb(env);
	const [row] = await db
		.select({ id: messages.id, rawR2Key: messages.rawR2Key })
		.from(messages)
		.where(and(eq(messages.id, id), eq(messages.userId, auth.user.id), eq(messages.status, "template")))
		.limit(1);
	if (!row) return NextResponse.json({ error: "Template not found" }, { status: 404 });
	await deleteMessageWithObjects(env, db, row.id, row.rawR2Key);
	return NextResponse.json({ ok: true });
}
