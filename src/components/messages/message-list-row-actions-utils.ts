import type { TranslationKey } from "@/lib/i18n/types";
import { authFetch } from "@/lib/auth/client";
import type { MessageCountsDelta } from "@/hooks/types";
import { dateFromZonedFields, formatUserDateTimeLocal, getUserTimeZone, parseUserDateTimeLocal, zonedDateFields } from "@/lib/time/utils";

export type SnoozePreset = {
	labelKey: TranslationKey;
	value: string;
};

export function formatSnoozeDateTime(date: Date): string {
	return formatUserDateTimeLocal(date);
}

export function getSnoozePresets(now = new Date()): SnoozePreset[] {
	const today = zonedDateFields(now, getUserTimeZone());
	const tomorrow = new Date(today);
	tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
	const nextWeek = new Date(today);
	nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
	const nextMonth = new Date(today);
	nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

	return [
		{ labelKey: "snooze.tomorrow", value: formatSnoozeDateTime(dateFromZonedFields(tomorrow, getUserTimeZone())) },
		{ labelKey: "snooze.nextWeek", value: formatSnoozeDateTime(dateFromZonedFields(nextWeek, getUserTimeZone())) },
		{ labelKey: "snooze.nextMonth", value: formatSnoozeDateTime(dateFromZonedFields(nextMonth, getUserTimeZone())) },
	];
}

export async function snoozeMessage(messageId: string, snoozedUntil: string) {
	const parsed = parseUserDateTimeLocal(snoozedUntil);
	if (!parsed) throw new Error("Choose a valid snooze time");
	const response = await authFetch(`/api/messages/${messageId}/snooze`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ snoozedUntil: parsed.toISOString() }),
	});
	if (!response.ok) throw new Error("Unable to snooze message");
	window.dispatchEvent(new Event("mailflare:messages-changed"));
}

export function isMessageSnoozed(snoozedUntil?: string | null): boolean {
	return !!snoozedUntil && new Date(snoozedUntil) > new Date();
}

export async function unsnoozeMessage(messageId: string) {
	const response = await authFetch(`/api/messages/${messageId}/snooze`, { method: "DELETE" });
	if (!response.ok) throw new Error("Unable to unsnooze message");
	window.dispatchEvent(new Event("mailflare:messages-changed"));
}

export async function toggleMessageStar(messageId: string) {
	const response = await authFetch(`/api/messages/${messageId}/star`, { method: "POST" });
	if (!response.ok) throw new Error("Unable to update message star");
	const result = (await response.json()) as { starred: boolean };
	window.dispatchEvent(new Event("mailflare:message-counts-changed"));
	return result;
}

export function dispatchMessageCountsDelta(detail: MessageCountsDelta) {
	window.dispatchEvent(new CustomEvent<MessageCountsDelta>("mailflare:message-counts-delta", { detail }));
}
