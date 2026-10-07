export type AgentSendSnapshot = {
	from: string;
	to: string;
	cc: string | null;
	bcc: string | null;
	subject: string;
	text: string | null;
	html: string | null;
	inReplyTo: string | null;
	references: string | null;
	threadId: string | null;
	mailboxId: string;
	scheduledAt: string | null;
	attachments: { id: string; filename: string; size: number; digest: string }[];
};
