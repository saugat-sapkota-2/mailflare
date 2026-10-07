export function parseAgentScheduledAt(value: string | null): Date | null {
	if (value === null) return null;
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error("Use a date and time with a timezone offset");
	const date = new Date(value);
	if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new Error("Scheduled time must be in the future");
	return date;
}
