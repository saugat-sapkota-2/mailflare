import { DEFAULT_FOLDER_COLOR } from "@/lib/folders/colors";
import type { BookingEvent } from "./types";

const DEFAULT_EVENTS = [
	{ id: "template:30-minute", name: "30 Minute Meeting", slug: "30-minute-meeting", durationMinutes: 30, startTime: "09:00", endTime: "11:00" },
	{ id: "template:15-minute", name: "15 Minute Meeting", slug: "15-minute-meeting", durationMinutes: 15, startTime: "14:00", endTime: "16:00" },
] as const;

export function visibleBookingEvents(events: BookingEvent[], userId: string, timeZone: string): BookingEvent[] {
	if (!userId || events.some((event) => !DEFAULT_EVENTS.some((template) => template.slug === event.slug))) return events;
	const existingSlugs = new Set(events.map((event) => event.slug));
	const templates: BookingEvent[] = DEFAULT_EVENTS.filter((template) => !existingSlugs.has(template.slug)).map((template) => ({
		...template,
		userId,
		description: "",
		color: DEFAULT_FOLDER_COLOR,
		hostIds: JSON.stringify([userId]),
		location: "",
		weekdays: "[1,2,3,4,5]",
		timeRanges: JSON.stringify([{ startTime: template.startTime, endTime: template.endTime }]),
		timeZone,
		enabled: false,
		isTemplate: true as const,
	}));
	return [...events, ...templates];
}
