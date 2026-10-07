import { getEnv } from "@/lib/cloudflare";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getAgentSendRequest } from "@/lib/agent/approvals/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
	try { return Response.json(await getAgentSendRequest(env, user, (await params).id)); }
	catch { return Response.json({ error: "Approval not found" }, { status: 404 }); }
}
