import { authFetch } from "@/lib/auth/client";
import type { ComposeAttachment, ComposeDraft, DraftResponse } from "./types";

export async function fetchDraft(draftId: string): Promise<ComposeDraft> {
	const res = await authFetch(`/api/drafts/${draftId}`);
	const json = (await res.json()) as DraftResponse;

	if (!res.ok || !json.draft) {
		throw new Error(json.error ?? "Failed to load draft");
	}

	return json.draft;
}

export function buildSendFormData(input: {
	attachments: ComposeAttachment[];
	from: string;
	mailboxId?: string;
	subject: string;
	text: string;
	to: string;
}): FormData {
	const form = new FormData();
	form.set("from", input.from);
	form.set("to", input.to);
	form.set("subject", input.subject);
	form.set("text", input.text);
	if (input.mailboxId) form.set("mailboxId", input.mailboxId);
	for (const attachment of input.attachments) {
		form.append("attachments", attachment.file);
	}
	return form;
}

export function formatAttachmentSize(size: number): string {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function applyMailboxSignature(
	text: string,
	previousSignature: string | null | undefined,
	nextSignature: string | null | undefined,
): string {
	const previousBlock = formatSignatureBlock(previousSignature);
	const nextBlock = formatSignatureBlock(nextSignature);
	if (previousBlock && text.includes(previousBlock)) {
		return text.replace(previousBlock, nextBlock);
	}
	if (!nextBlock || text.includes(nextBlock)) return text;
	if (!text) return nextBlock;
	if (/^\s*[^\n]+ wrote:\n>/i.test(text)) return `${nextBlock}${text}`;
	return `${text}${nextBlock}`;
}

function formatSignatureBlock(signature: string | null | undefined): string {
	const value = signature?.trim() ?? "";
	return value ? `\n\n${value}` : "";
}
