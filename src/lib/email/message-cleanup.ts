import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { messages } from "@/db/schema";
import { deleteMessageAttachmentObjects } from "@/lib/email/attachments";

/** Remove every external object owned by a message before deleting its row. */
export async function deleteMessageWithObjects(
	env: CloudflareEnv,
	db: AppDatabase,
	id: string,
	rawR2Key: string | null,
): Promise<void> {
	await deleteMessageAttachmentObjects(env, id);
	if (rawR2Key) await env.BUCKET.delete(rawR2Key);
	await db.delete(messages).where(eq(messages.id, id));
}
