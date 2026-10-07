function asRecord(value: unknown): Record<string, unknown> | null {
	return value !== null && typeof value === "object" ? value as Record<string, unknown> : null;
}

function readableText(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const text = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
	return text ? text.slice(0, 800) : null;
}

function parseResponseBody(value: unknown): Record<string, unknown> | null {
	if (typeof value !== "string") return asRecord(value);
	try { return asRecord(JSON.parse(value)); }
	catch { return null; }
}

export function agentProviderErrorMessage(error: unknown): string {
	const details = asRecord(error);
	const cause = asRecord(details?.cause);
	const body = parseResponseBody(details?.responseBody ?? cause?.responseBody ?? details?.data);
	const providerError = asRecord(body?.error);
	const metadata = asRecord(providerError?.metadata);
	const status = details?.statusCode ?? cause?.statusCode ?? providerError?.code;
	const code = typeof status === "number" && status >= 400 && status < 600 ? status : typeof status === "string" && /^[45]\d\d$/.test(status) ? Number(status) : null;
	const message = readableText(metadata?.raw) ?? readableText(providerError?.message) ?? readableText(body?.error) ?? readableText(body?.message) ?? readableText(details?.message) ?? readableText(error);
	if ((!message || message === "Provider returned error") && code === 429) return "The AI provider is temporarily rate-limited. Retry shortly or choose another model.";
	if (!message) return "The assistant could not finish this request";
	return code ? `AI provider error ${code}: ${message}` : message;
}
