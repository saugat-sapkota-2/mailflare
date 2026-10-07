import { countDistinct, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { messages } from "@/db/schema";
import type { ConversationPage, ConversationPageInput, MessageListColumns } from "./types";

export function getMessageListColumns(): MessageListColumns {
	return Object.fromEntries(
		Object.entries(getTableColumns(messages)).filter(([name]) => name !== "textBody" && name !== "htmlBody"),
	) as MessageListColumns;
}

/** Select one newest matching message per thread before applying pagination. */
export async function loadConversationPage({ db, where, offset, limit }: ConversationPageInput): Promise<ConversationPage> {
	const threadKey = sql<string>`coalesce(${messages.threadId}, ${messages.id})`;
	const ranked = db
		.select({
			id: messages.id,
			createdAt: messages.createdAt,
			position: sql<number>`row_number() over (partition by ${threadKey} order by ${messages.createdAt} desc, ${messages.id} desc)`.as("position"),
		})
		.from(messages)
		.where(where)
		.as("conversation_heads");

	// Always two queries, even for deep pages or threads with many messages.
	const [totals, heads] = await Promise.all([
		db.select({ total: countDistinct(threadKey) }).from(messages).where(where),
		db
			.select({ id: ranked.id })
			.from(ranked)
			.where(eq(ranked.position, 1))
			.orderBy(desc(ranked.createdAt), desc(ranked.id))
			.limit(limit)
			.offset(offset),
	]);

	return { ids: heads.map((head) => head.id), total: totals[0]?.total ?? 0 };
}
