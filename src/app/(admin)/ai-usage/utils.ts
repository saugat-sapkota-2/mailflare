import { authFetch } from "@/lib/auth/client";
import { formatUserDate, getUserTimeZone, recentZonedDays } from "@/lib/time/utils";
import type { AiUsageDaily, AiUsageResponse } from "./types";

export async function fetchAiUsage(page: number): Promise<AiUsageResponse> {
	const response = await authFetch(`/api/admin/ai-usage?page=${page}`);
	const data = await response.json() as AiUsageResponse;
	if (!response.ok) throw new Error(data.error || "Could not load AI usage");
	return data;
}

export function formatTokenCount(value: number | null) {
	return value === null ? "—" : new Intl.NumberFormat().format(value);
}

export function formatEstimatedUsd(micros: number | null) {
	if (micros === null) return "—";
	const dollars = micros / 1_000_000;
	return `$${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: dollars < 0.01 && dollars > 0 ? 6 : 2 })}`;
}

export function formatUsageDate(value: string) {
	return formatUserDate(value, { dateStyle: "medium", timeStyle: "short" });
}

export function formatUsageProvider(value: string) {
	return ({ cloudflare: "Cloudflare Workers AI", openai: "OpenAI", openrouter: "OpenRouter", groq: "Groq", custom: "Custom API" } as Record<string, string>)[value] ?? value;
}

export function fillDailyUsage(days: AiUsageDaily[], timeZone = getUserTimeZone()): AiUsageDaily[] {
	const byDate = new Map(days.map((day) => [day.date, day]));
	return recentZonedDays(timeZone, 30).map(({ date }) => {
		return byDate.get(date) ?? { date, requests: 0, inputTokens: 0, outputTokens: 0 };
	});
}

export function formatDailyLabel(value: string) {
	return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
