import { and, eq, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { agentConversations, agentSendApprovals } from "@/db/schema";
import { recoverAgentDraftJobs } from "./jobs/utils";

export async function runAgentMaintenance(env: CloudflareEnv) {
	const db = getDb(env);
	const now = new Date();
	await db.update(agentSendApprovals).set({ status: "expired" }).where(and(eq(agentSendApprovals.status, "pending"), lt(agentSendApprovals.expiresAt, now)));
	await db.update(agentSendApprovals).set({ status: "unknown" }).where(and(eq(agentSendApprovals.status, "claimed"), lt(agentSendApprovals.claimedAt, new Date(Date.now() - 3 * 60_000))));
	await db.delete(agentConversations).where(lt(agentConversations.updatedAt, new Date(Date.now() - 30 * 24 * 60 * 60_000)));
	await recoverAgentDraftJobs(env);
}
