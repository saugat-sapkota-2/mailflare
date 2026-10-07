export function agentTimeContext(timeZone?: string): string {
	const now = new Date();
	let zone = "UTC";
	try {
		if (timeZone) {
			new Intl.DateTimeFormat("en-US", { timeZone }).format(now);
			zone = timeZone;
		}
	} catch { /* Fall back to UTC for an invalid timezone. */ }
	const local = new Intl.DateTimeFormat("en-US", { timeZone: zone, dateStyle: "full", timeStyle: "long" }).format(now);
	return `Current UTC time: ${now.toISOString()}. User timezone: ${zone}. Current user time: ${local}.`;
}
