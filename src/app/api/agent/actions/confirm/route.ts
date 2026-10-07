import { z } from "zod";
import { getEnv } from "@/lib/cloudflare";
import { getCurrentUser } from "@/lib/auth/cookies";
import { hasValidSessionMutationOrigin } from "@/lib/auth/origin";
import { confirmAgentAction } from "@/lib/agent/actions";

const schema = z.object({ toolMessageId: z.string().min(1) });

export async function POST(request: Request) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
	if (!hasValidSessionMutationOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
	const parsed = schema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
	try { return Response.json(await confirmAgentAction(env, user, parsed.data.toolMessageId)); }
	catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not approve action" }, { status: 409 }); }
}
