import type { AttachmentContent } from "@/lib/email/attachment-types";

export interface SendRequestPayload {
	attachments?: AttachmentContent[];
	from: string;
	html?: string;
	mailboxId?: string;
	subject: string;
	text?: string;
	to: string;
}
