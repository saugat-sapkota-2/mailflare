import { authFetch } from "@/lib/auth/client";
import { formatUserDate } from "@/lib/time/utils";
import type { AuthenticationSummary, MessageSourceSummary } from "./message-source-types";

export async function fetchMessageSource(messageId: string, signal: AbortSignal): Promise<string> {
	const response = await authFetch(`/api/messages/${encodeURIComponent(messageId)}/original`, {
		signal,
		redirectOnUnauthorized: false,
	});
	const source = await response.text();
	if (!response.ok) throw new Error(source || "Unable to load original message");
	return source;
}

function readHeaders(source: string): Map<string, string[]> {
	const boundary = source.match(/\r?\n\r?\n/);
	const headerText = boundary?.index === undefined ? source : source.slice(0, boundary.index);
	const headers = new Map<string, string[]>();
	let currentName: string | null = null;
	for (const line of headerText.split(/\r?\n/)) {
		if (/^[ \t]/.test(line) && currentName) {
			const values = headers.get(currentName);
			if (values?.length) values[values.length - 1] += ` ${line.trim()}`;
			continue;
		}
		const separator = line.indexOf(":");
		if (separator < 1) {
			currentName = null;
			continue;
		}
		currentName = line.slice(0, separator).toLowerCase();
		const values = headers.get(currentName) ?? [];
		values.push(line.slice(separator + 1).trim());
		headers.set(currentName, values);
	}
	return headers;
}

function firstHeader(headers: Map<string, string[]>, name: string): string | null {
	return headers.get(name)?.[0] ?? null;
}

function deliveryDuration(headers: Map<string, string[]>, sentAt: Date): string | null {
	const received = firstHeader(headers, "received");
	const receivedDate = received?.slice(received.lastIndexOf(";") + 1).trim();
	if (!received || !receivedDate || !received.includes(";")) return null;
	const deliveredAt = new Date(receivedDate);
	const seconds = Math.round((deliveredAt.getTime() - sentAt.getTime()) / 1000);
	if (!Number.isFinite(seconds) || seconds < 0) return null;
	if (seconds < 60) return `Delivered after ${seconds} ${seconds === 1 ? "second" : "seconds"}`;
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `Delivered after ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
	const hours = Math.round(minutes / 60);
	if (hours < 48) return `Delivered after ${hours} ${hours === 1 ? "hour" : "hours"}`;
	const days = Math.round(hours / 24);
	return `Delivered after ${days} ${days === 1 ? "day" : "days"}`;
}

function authResult(headers: Map<string, string[]>, method: "spf" | "dkim" | "dmarc"): AuthenticationSummary | null {
	const resultHeader = headers.get("authentication-results")?.find((value) => new RegExp(`(?:^|[;\\s])${method}\\s*=`, "i").test(value));
	const result = resultHeader?.match(new RegExp(`(?:^|[;\\s])${method}\\s*=\\s*([a-z]+)`, "i"))?.[1]
		?? (method === "spf" ? firstHeader(headers, "received-spf")?.match(/^\s*([a-z]+)/i)?.[1] : null);
	if (!result) return null;
	const status = result.toUpperCase();
	if (status !== "PASS") return { status, detail: null };
	const section = resultHeader?.split(";").find((value) => new RegExp(`(?:^|\\s)${method}\\s*=`, "i").test(value)) ?? "";
	if (method === "spf") {
		const ip = section.match(/\bclient-ip\s*=\s*([^\s;)]+)/i)?.[1]
			?? firstHeader(headers, "received-spf")?.match(/\bclient-ip\s*=\s*([^\s;)]+)/i)?.[1];
		return { status, detail: ip ? `with IP ${ip}` : null };
	}
	if (method === "dkim") {
		const domain = section.match(/\bheader\.d\s*=\s*([^\s;)]+)/i)?.[1]
			?? firstHeader(headers, "dkim-signature")?.match(/(?:^|;)\s*d\s*=\s*([^\s;)]+)/i)?.[1];
		return { status, detail: domain ? `with domain ${domain}` : null };
	}
	return { status, detail: null };
}

export function summarizeMessageSource(source: string): MessageSourceSummary {
	const headers = readHeaders(source);
	const date = firstHeader(headers, "date");
	const parsedDate = date ? new Date(date) : null;
	const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
	const duration = validDate ? deliveryDuration(headers, validDate) : null;
	return {
		messageId: firstHeader(headers, "message-id"),
		createdAt: validDate ? `${formatUserDate(validDate, { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}${duration ? ` (${duration})` : ""}` : date,
		from: firstHeader(headers, "from"),
		to: firstHeader(headers, "to"),
		subject: firstHeader(headers, "subject"),
		spf: authResult(headers, "spf"),
		dkim: authResult(headers, "dkim"),
		dmarc: authResult(headers, "dmarc"),
	};
}

export function downloadMessageSource(source: string, messageId: string): void {
	const url = URL.createObjectURL(new Blob([source], { type: "message/rfc822" }));
	const link = document.createElement("a");
	link.href = url;
	link.download = `original-${messageId}.eml`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function copyMessageSource(source: string): Promise<void> {
	await navigator.clipboard.writeText(source);
}
