import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { agentConversations } from "@/db/schema";
import { getEnv } from "@/lib/cloudflare";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getAgentChatHistory } from "@/lib/agent/chat";
import { hasValidSessionMutationOrigin } from "@/lib/auth/origin";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
	const { id } = await params;
	const mailboxId = new URL(request.url).searchParams.get("mailboxId");
	if (!mailboxId) return Response.json({ error: "Mailbox required" }, { status: 400 });
	try { return Response.json({ messages: await getAgentChatHistory({ env, user, mailboxId, origin: "chat" }, id) }); }
	catch { return Response.json({ error: "Conversation not found" }, { status: 404 }); }
}

export async function DELETE(request: Request, { params }: Params) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
	if (!hasValidSessionMutationOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
	const { id } = await params;
	await getDb(env).delete(agentConversations).where(and(eq(agentConversations.id, id), eq(agentConversations.userId, user.id)));
	return Response.json({ ok: true });
}
