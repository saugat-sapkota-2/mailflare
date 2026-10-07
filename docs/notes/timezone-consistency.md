# User time and timezone handling

Users choose an IANA timezone in `/settings/account`. Leaving it blank follows the current device's timezone. The preference is stored on `users.time_zone`; an authenticated browser loads it from `/api/auth/me`. Database timestamps remain absolute instants; UI inputs are sent as ISO strings with `Z`.

## Requests and date searches

Authenticated browser requests send `X-Time-Zone`. Message queries also include `timeZone` so cached searches are scoped to their timezone. The saved account preference takes precedence on the server. When the preference is blank, API consumers can supply either a query parameter or header; the query parameter takes precedence. Missing or invalid zones fall back to UTC.

`after:` / `newer:` are inclusive local-midnight boundaries, and `before:` / `older:` are exclusive local-midnight boundaries. Each date uses its own timezone offset. Chat searches use the same timezone as the assistant's time context.

## Daily AI usage

The API groups the last 30 calendar days using the requesting user's timezone, including days shorter or longer than 24 hours. The chart names that timezone and uses the dates returned by the API.

## Calendar

Migrations `0047_add_calendar_time_zone.sql` and `0048_add_user_time_zone.sql` add nullable columns to `calendar_events` and `users`. Apply pending migrations before running the updated app. The migration bundle includes both migrations.

New events store their timezone. Recurrences use that timezone's calendar dates and clock time, while their displayed times follow the viewer's account preference. Editing an existing series preserves its saved timezone. The editor shows the recurrence timezone beside its repeat controls.

Legacy events have no recoverable original timezone. When the user saves a timezone preference, recurring legacy series are anchored to the timezone they were using just before the change. Their initial instants remain intact, and changing the preference later only changes display. Before that first save, a legacy series follows the viewing device's timezone. Older backups remain restorable after migration because both new columns are nullable; `users` and `calendar_events` are already included in backups, whose export reads all columns.

During a daylight-saving overlap, generated occurrences use the earlier instant; during a gap, they move forward by the gap. The series' initial timestamp is preserved. The calendar's 24-hour visual grid cannot show repeated hours separately; an event ending earlier on the clock during a fallback retains a visible block.

## Operational schedules

Backups still run at the explicitly labeled 02:00 UTC schedule. Automated assistant daily limits still reset at UTC midnight. Session expiration uses a fixed 30-day elapsed duration, independent of the server's timezone.

## Verification status

Changes were based on source inspection. No tests, build, lint, type checks, runtime validation, or database migrations were run, as requested.
