import { textToHtml } from "@/components/compose/rich-text-utils";

export function formatAgentDraftBody(body: string) {
	const text = body.replace(/\r\n?/g, "\n").split("\n").map((line) => line
		.replace(/^\s*```[^\n]*$/, "")
		.replace(/^\s{0,3}#{1,6}\s+/, "")
		.replace(/^\s{0,3}[-*+]\s+/, "• ")
		.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1 ($2)")
		.replace(/\*\*([^*\n]+)\*\*/g, "$1")
		.replace(/__([^_\n]+)__/g, "$1")
		.replace(/\*([^*\n]+)\*/g, "$1")
		.replace(/_([^_\n]+)_/g, "$1")
		.replace(/~~([^~\n]+)~~/g, "$1")
		.replace(/`([^`\n]+)`/g, "$1")
	).join("\n").replace(/\n{3,}/g, "\n\n").trim();
	return { text, html: textToHtml(text) };
}
