import { getEnv } from "@/lib/cloudflare";
import { getCurrentUser } from "@/lib/auth/cookies";
import { confirmAgentSend } from "@/lib/agent/approvals/utils";
import { hasValidSessionMutationOrigin } from "@/lib/auth/origin";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
	if (!hasValidSessionMutationOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
	try { return Response.json(await confirmAgentSend(env, user, (await params).id, new URL(request.url).origin)); }
	catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Send could not be confirmed" }, { status: 409 }); }
}
