import { authFetch } from "@/lib/auth/client";
import { isValidTimeZone } from "@/lib/time/utils";
import type { TimeZoneUpdateResponse } from "./time-zone-form-types";

export function listTimeZones(deviceTimeZone: string): string[] {
	const supported = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
	return [...new Set(["UTC", deviceTimeZone, ...supported])].sort((a, b) => a.localeCompare(b));
}

export function formatCurrentTimeInZone(timeZone: string): string {
	return new Intl.DateTimeFormat(undefined, { timeZone, dateStyle: "full", timeStyle: "short" }).format(new Date());
}

export async function updateUserTimeZone(value: string): Promise<string | null> {
	const timeZone = value.trim() || null;
	if (timeZone && !isValidTimeZone(timeZone)) throw new Error("Choose a valid timezone, such as Asia/Ho_Chi_Minh");
	const response = await authFetch("/api/settings/time-zone", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ timeZone }),
	});
	const data = await response.json() as TimeZoneUpdateResponse;
	if (!response.ok) throw new Error(data.error || "Could not save timezone");
	return data.timeZone ?? null;
}
