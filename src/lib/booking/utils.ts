import { dateFromZonedFields, isValidTimeZone, zonedDateFields } from "@/lib/time/utils";
import type { BookingEventInput, BookingEventRecord, BookingTimeRange } from "./types";
import { normalizeCalendarColor } from "@/lib/calendar/colors";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function slugifyBookingName(value: string): string {
	return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-$/, "");
}

export function isValidBookingSlug(value: string): boolean {
	return value.length >= 1 && value.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function normalizeBookingUsername(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const username = value.trim().toLowerCase();
	return username.length >= 1 && username.length <= 64 && /^[a-z0-9._+-]+$/.test(username) && /[a-z0-9]/.test(username) ? username : null;
}

export function bookingUsernameFromEmail(email: string): string {
	const localPart = email.split("@")[0] ?? "";
	const candidate = localPart.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9._+-]+/g, "-").slice(0, 56);
	return normalizeBookingUsername(candidate) ?? "user";
}

export function parseBookingTimeRanges(value: string, fallback?: BookingTimeRange): BookingTimeRange[] {
	try {
		const parsed: unknown = JSON.parse(value);
		if (Array.isArray(parsed) && parsed.length && parsed.every((range) => range && typeof range === "object" && typeof range.startTime === "string" && typeof range.endTime === "string")) return parsed as BookingTimeRange[];
	} catch { /* Older rows use the single time window. */ }
	return fallback ? [fallback] : [];
}

export function parseBookingEventInput(value: unknown): BookingEventInput | null {
	if (!value || typeof value !== "object") return null;
	const input = value as Record<string, unknown>;
	const name = typeof input.name === "string" ? input.name.trim() : "";
	const slug = typeof input.slug === "string" ? input.slug.trim().toLowerCase() : slugifyBookingName(name);
	const description = typeof input.description === "string" ? input.description.trim() : "";
	const location = typeof input.location === "string" ? input.location.trim() : "";
	const weekdays = input.weekdays;
	const hostIds = input.hostIds === undefined ? [] : input.hostIds;
	if (!name || name.length > 120 || !isValidBookingSlug(slug) || description.length > 2000 || location.length > 240 || typeof input.durationMinutes !== "number" || !Number.isInteger(input.durationMinutes) || input.durationMinutes < 5 || input.durationMinutes > 480) return null;
	if (!Array.isArray(hostIds) || hostIds.length > 20 || hostIds.some((id) => typeof id !== "string" || !id) || new Set(hostIds).size !== hostIds.length) return null;
	if (!Array.isArray(weekdays) || !weekdays.length || weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6) || new Set(weekdays).size !== weekdays.length) return null;
	const timeRanges: unknown = input.timeRanges ?? (typeof input.startTime === "string" && typeof input.endTime === "string" ? [{ startTime: input.startTime, endTime: input.endTime }] : null);
	if (!Array.isArray(timeRanges) || !timeRanges.length || timeRanges.length > 12) return null;
	if (timeRanges.some((range) => !range || typeof range !== "object" || typeof range.startTime !== "string" || typeof range.endTime !== "string" || !timePattern.test(range.startTime) || !timePattern.test(range.endTime) || timeToMinutes(range.startTime) % 15 !== 0 || timeToMinutes(range.endTime) % 15 !== 0 || timeToMinutes(range.endTime) - timeToMinutes(range.startTime) < (input.durationMinutes as number))) return null;
	const normalizedRanges = (timeRanges as BookingTimeRange[]).slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
	if (normalizedRanges.some((range, index) => index > 0 && range.startTime < normalizedRanges[index - 1].endTime)) return null;
	if (typeof input.timeZone !== "string" || !isValidTimeZone(input.timeZone) || typeof input.enabled !== "boolean") return null;
	return { name, slug, description, color: normalizeCalendarColor(typeof input.color === "string" ? input.color : undefined), hostIds, durationMinutes: input.durationMinutes, location, weekdays: [...weekdays].sort(), startTime: normalizedRanges[0].startTime, endTime: normalizedRanges[0].endTime, timeRanges: normalizedRanges, timeZone: input.timeZone, enabled: input.enabled };
}

export function timeToMinutes(value: string): number {
	const [hours, minutes] = value.split(":").map(Number);
	return hours * 60 + minutes;
}

export function slotFromLocalDate(event: BookingEventRecord, localDate: string, time: string): { startsAt: Date; endsAt: Date } | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate) || !timePattern.test(time)) return null;
	const wall = new Date(`${localDate}T${time}:00Z`);
	if (Number.isNaN(wall.getTime()) || wall.toISOString().slice(0, 10) !== localDate || !event.weekdays.includes(wall.getUTCDay())) return null;
	const minutes = timeToMinutes(time);
	if (!event.timeRanges.some((range) => minutes >= timeToMinutes(range.startTime) && minutes + event.durationMinutes <= timeToMinutes(range.endTime)) || minutes % 15 !== 0) return null;
	const startsAt = dateFromZonedFields(wall, event.timeZone);
	if (zonedDateFields(startsAt, event.timeZone).toISOString().slice(0, 16) !== `${localDate}T${time}`) return null;
	return { startsAt, endsAt: new Date(startsAt.getTime() + event.durationMinutes * 60_000) };
}

export function parseBookingWeekdays(value: string): number[] {
	try {
		const days: unknown = JSON.parse(value);
		return Array.isArray(days) ? days.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6) : [];
	} catch { return []; }
}
