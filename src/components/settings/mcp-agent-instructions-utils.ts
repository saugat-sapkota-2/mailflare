import type { McpAgentInstructionsProps } from "./mcp-agent-instructions-types";

export function buildMcpAgentPrompt(origin: string, { mode, apiKey }: McpAgentInstructionsProps): string {
	const serverUrl = `${origin || "https://your-mailflare-domain"}/mcp`;
	const instructions = mode === "mail"
		? "Use get_calendars for calendar access and list_mailboxes for mail access when available. Use only the tools and mailbox IDs returned by this server. Calendar changes save immediately. Sending mail requires a review request and confirmation in Mailflare."
		: "Use only the admin management tools and permissions exposed by this key. This key cannot read or send mail.";

	return `Connect to my Mailflare MCP server using these settings:\nServer URL: ${serverUrl}\nTransport: Streamable HTTP\nAuthorization header: Bearer ${apiKey}\n\n${instructions}\nDo not print the API key in your replies or logs. If you cannot configure the MCP connection directly, tell me which settings to enter in my client.`;
}
