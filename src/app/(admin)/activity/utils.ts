import { defaultTranslator, type Translator } from "@/lib/i18n/utils";
import { authFetch } from "@/lib/auth/client";
import { formatUserDate } from "@/lib/time/utils";
import type { ActivityLog, ActivityMetadata } from "./types";

export async function fetchActivity(): Promise<ActivityLog[]> {
	const res = await authFetch("/api/activity");
	const json = (await res.json()) as { activities?: ActivityLog[]; error?: string };
	if (!res.ok) throw new Error(json.error ?? "Failed to load activity");
	return json.activities ?? [];
}

export function formatActivityDate(value: string): string {
	return formatUserDate(value, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

export function getActivityLabel(action: string, t: Translator = defaultTranslator): string {
	if (action === "auth.login") return t("activity.login");
	if (action === "auth.logout") return t("activity.logout");
	return action;
}

export function getActivityMetadata(log: ActivityLog): ActivityMetadata {
	if (!log.metadata) return {};
	try {
		return JSON.parse(log.metadata) as ActivityMetadata;
	} catch {
		return {};
	}
}
