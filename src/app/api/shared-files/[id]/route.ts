import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { messageAttachments, sharedAttachmentLinks } from "@/db/schema";
import { getEnv } from "@/lib/cloudflare";
import { getAttachmentContentDisposition } from "@/app/api/messages/[messageId]/attachments/[attachmentId]/utils";
import type { SharedFileParams } from "./types";

export async function GET(_request: Request, { params }: SharedFileParams) {
	const { id } = await params;
	const env = getEnv();
	const [file] = await getDb(env)
		.select({ r2Key: messageAttachments.r2Key, filename: messageAttachments.filename, size: messageAttachments.size, contentType: messageAttachments.contentType })
		.from(sharedAttachmentLinks)
		.innerJoin(messageAttachments, eq(sharedAttachmentLinks.attachmentId, messageAttachments.id))
		.where(and(eq(sharedAttachmentLinks.id, id), gt(sharedAttachmentLinks.expiresAt, new Date())))
		.limit(1);
	if (!file) return new Response("Link expired or not found", { status: 404 });
	const object = await env.BUCKET.get(file.r2Key);
	if (!object) return new Response("File not found", { status: 404 });
	const headers = new Headers();
	headers.set("Content-Type", file.contentType);
	headers.set("Content-Length", String(file.size));
	headers.set("Content-Disposition", getAttachmentContentDisposition(file.filename, false));
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
	headers.set("Referrer-Policy", "no-referrer");
	headers.set("Cache-Control", "private, no-store");
	return new Response(object.body, { headers });
}
