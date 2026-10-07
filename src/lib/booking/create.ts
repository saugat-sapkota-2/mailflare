import { newId } from "@/lib/ids";
import type { BookingEventRecord } from "./types";

export async function createBookedCalendarEvents(env: CloudflareEnv, event: BookingEventRecord, guestName: string, guestEmail: string, startsAt: string, endsAt: string, guestEmails: string[] = [], notes = ""): Promise<boolean> {
	const hostIds = event.hostIds;
	const startSeconds = Math.floor(new Date(startsAt).getTime() / 1000);
	const endSeconds = Math.floor(new Date(endsAt).getTime() / 1000);
	const nowSeconds = Math.floor(Date.now() / 1000);
	const selectedHosts = hostIds.map(() => "(?, ?)").join(", ");
	const hostPlaceholders = hostIds.map(() => "?").join(", ");
	const result = await env.DB.prepare(`WITH requested_hosts(host_id, event_id) AS (VALUES ${selectedHosts}),
		conflicts AS MATERIALIZED (SELECT COUNT(*) AS total FROM calendar_events WHERE user_id IN (${hostPlaceholders}) AND repeat = 'none' AND starts_at < ? AND ends_at > ?)
		INSERT INTO calendar_events (id, user_id, mailbox_id, title, description, location, attendees, color, repeat, repeat_days, excluded_occurrences, time_zone, starts_at, ends_at, created_at, updated_at)
		SELECT requested_hosts.event_id, requested_hosts.host_id, NULL, ?, ?, ?, ?, ?, 'none', '[]', '[]', ?, ?, ?, ?, ?
		FROM requested_hosts CROSS JOIN conflicts
		WHERE conflicts.total = 0`)
		.bind(
			...hostIds.flatMap((id) => [id, newId("evt")]),
			...hostIds,
			endSeconds,
			startSeconds,
			`${event.name} with ${guestName}`,
			[`Booked by ${guestName} (${guestEmail})`, notes].filter(Boolean).join("\n\n"),
			event.location,
			JSON.stringify([guestEmail, ...guestEmails]),
			event.color,
			event.timeZone,
			startSeconds,
			endSeconds,
			nowSeconds,
			nowSeconds,
		).run();
	return result.meta.changes === hostIds.length;
}
