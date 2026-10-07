import { getEnv } from "@/lib/cloudflare";
import { getCurrentUser } from "@/lib/auth/cookies";
import { listAgentConversations } from "@/lib/agent/chat";

export async function GET(request: Request) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
	const mailboxId = new URL(request.url).searchParams.get("mailboxId");
	if (!mailboxId) return Response.json({ error: "Mailbox required" }, { status: 400 });
	try {
		return Response.json({ conversations: await listAgentConversations({ env, user, mailboxId, origin: "chat" }) });
	} catch {
		return Response.json({ error: "Mailbox not found" }, { status: 404 });
	}
}
