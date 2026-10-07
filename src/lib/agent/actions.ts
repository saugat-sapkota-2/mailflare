import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { agentChatMessages, agentConversations } from "@/db/schema";
import type { SessionUser } from "@/lib/auth/types";
import { runEmailTool } from "./tools";
import type { EmailToolName } from "./types";

const proposalSchema = z.discriminatedUnion("action", [
	z.object({ action: z.literal("move_email"), status: z.literal("pending_approval"), emailIds: z.array(z.string()).length(1), destination: z.enum(["inbox", "archived", "trash", "spam"]) }),
	z.object({ action: z.literal("move_emails"), status: z.literal("pending_approval"), emailIds: z.array(z.string()).min(1).max(20), destination: z.enum(["inbox", "archived", "trash", "spam"]) }),
	z.object({ action: z.literal("mark_email_read"), status: z.literal("pending_approval"), emailId: z.string(), read: z.boolean() }),
	z.object({ action: z.literal("discard_draft"), status: z.literal("pending_approval"), draftId: z.string(), expectedRevision: z.number().int().positive() }),
]);

export async function confirmAgentAction(env: CloudflareEnv, user: SessionUser, toolMessageId: string) {
	const db = getDb(env);
	const [row] = await db.select({ message: agentChatMessages, conversation: agentConversations }).from(agentChatMessages)
		.innerJoin(agentConversations, eq(agentChatMessages.conversationId, agentConversations.id))
		.where(and(eq(agentChatMessages.id, toolMessageId), eq(agentChatMessages.role, "tool"), eq(agentConversations.userId, user.id))).limit(1);
	if (!row) throw new Error("Action not found");
	const proposal = proposalSchema.safeParse(JSON.parse(row.message.content));
	if (!proposal.success || row.message.toolName !== proposal.data.action) throw new Error("Action is unavailable or already approved");
	const claimed = await db.update(agentChatMessages).set({ content: JSON.stringify({ ...JSON.parse(row.message.content), status: "processing" }) })
		.where(and(eq(agentChatMessages.id, toolMessageId), eq(agentChatMessages.content, row.message.content))).returning({ id: agentChatMessages.id });
	if (!claimed.length) throw new Error("Action is already being processed");
	try {
		const input = proposal.data.action === "move_email" ? { emailId: proposal.data.emailIds[0], destination: proposal.data.destination }
			: proposal.data.action === "move_emails" ? { emailIds: proposal.data.emailIds, destination: proposal.data.destination }
			: proposal.data.action === "mark_email_read" ? { emailId: proposal.data.emailId, read: proposal.data.read }
			: { draftId: proposal.data.draftId, expectedRevision: proposal.data.expectedRevision };
		const result = await runEmailTool({ env, user, mailboxId: row.conversation.mailboxId, origin: "mcp" }, proposal.data.action as EmailToolName, input);
		const updated = { ...JSON.parse(row.message.content), status: "approved", result };
		await db.update(agentChatMessages).set({ content: JSON.stringify(updated) }).where(eq(agentChatMessages.id, toolMessageId));
		return updated;
	} catch (error) {
		await db.update(agentChatMessages).set({ content: row.message.content }).where(eq(agentChatMessages.id, toolMessageId));
		throw error;
	}
}
