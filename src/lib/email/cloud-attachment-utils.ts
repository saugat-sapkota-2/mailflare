import type { AttachmentContent } from "./attachment-types";
import { CLOUD_ATTACHMENT_THRESHOLD_BYTES } from "./attachment-policy";
import { getOrCreateSharedAttachmentUrl } from "./shared-attachments";

const GENERAL_MESSAGE_LIMIT_BYTES = 5 * 1024 * 1024;
const MIME_SAFETY_MARGIN_BYTES = 256 * 1024;

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export async function prepareCloudflareAttachments(
	env: CloudflareEnv,
	attachments: AttachmentContent[],
	message: { subject: string; html?: string; text?: string; headers: Record<string, string>; publicOrigin?: string },
): Promise<{ attachments: AttachmentContent[]; html?: string; text?: string }> {
	const encoder = new TextEncoder();
	let estimatedSize = encoder.encode(message.subject + (message.html ?? "") + (message.text ?? "") + JSON.stringify(message.headers)).byteLength + 8192;
	const direct: AttachmentContent[] = [];
	const linked: { filename: string; size: number; url: string }[] = [];
	for (const attachment of attachments) {
		const size = attachment.content.byteLength;
		const encodedSize = Math.ceil(size / 3) * 4 + 2048;
		if (size <= CLOUD_ATTACHMENT_THRESHOLD_BYTES && estimatedSize + encodedSize <= GENERAL_MESSAGE_LIMIT_BYTES - MIME_SAFETY_MARGIN_BYTES) {
			direct.push(attachment);
			estimatedSize += encodedSize;
			continue;
		}
		if (!attachment.storageId) throw new Error("Large attachment was not stored in R2");
		linked.push({ filename: attachment.filename, size, url: await getOrCreateSharedAttachmentUrl(env, attachment.storageId, message.publicOrigin) });
	}
	if (!linked.length) {
		if (estimatedSize > GENERAL_MESSAGE_LIMIT_BYTES - MIME_SAFETY_MARGIN_BYTES) throw new Error("Message exceeds Cloudflare's 5 MiB email size limit");
		return { attachments: direct, html: message.html, text: message.text };
	}
	const intro = "Files shared through Mailflare (download links expire after 30 days):";
	const textLinks = linked.map((file) => `${file.filename} (${(file.size / 1_000_000).toFixed(1)} MB): ${file.url}`).join("\n");
	const htmlLinks = linked.map((file) => `<li>${escapeHtml(file.filename)} (${(file.size / 1_000_000).toFixed(1)} MB): <a href="${escapeHtml(file.url)}">Download file</a></li>`).join("");
	const text = [message.text?.trim(), intro, textLinks].filter(Boolean).join("\n\n");
	const html = `${message.html ?? ""}<div><p>${escapeHtml(intro)}</p><ul>${htmlLinks}</ul></div>`;
	if (estimatedSize + encoder.encode(textLinks + htmlLinks + intro + intro).byteLength + 4096 > GENERAL_MESSAGE_LIMIT_BYTES - MIME_SAFETY_MARGIN_BYTES) {
		throw new Error("Message exceeds Cloudflare's 5 MiB email size limit even with download links");
	}
	return { attachments: direct, html, text };
}
