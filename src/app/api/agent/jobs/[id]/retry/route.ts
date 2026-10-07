import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { agentJobs } from "@/db/schema";
import { getEnv } from "@/lib/cloudflare";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import { hasValidSessionMutationOrigin } from "@/lib/auth/origin";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
	if (!hasValidSessionMutationOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
	const { id } = await params;
	const db = getDb(env);
	const [job] = await db.select().from(agentJobs).where(eq(agentJobs.id, id)).limit(1);
	if (!job || job.reviewerUserId !== user.id || !(await getMailboxAccessLevel(db, user, job.mailboxId))?.canSendOnBehalf) return Response.json({ error: "Job not found" }, { status: 404 });
	if (job.status !== "failed") return Response.json({ error: "Job cannot be retried" }, { status: 409 });
	await db.update(agentJobs).set({ status: "pending", attempts: 0, nextAttemptAt: new Date(), leaseUntil: null, reason: null }).where(and(eq(agentJobs.id, id), eq(agentJobs.status, "failed")));
	await env.AGENT_QUEUE?.send({ kind: "agent.draft", jobId: id });
	return Response.json({ ok: true });
}
