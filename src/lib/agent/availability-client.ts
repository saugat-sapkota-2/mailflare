const STORAGE_KEY = "mailflare-assistant-enabled";

export function readInitialAssistantAvailability(): boolean | null {
	if (typeof window === "undefined") return null;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored === null ? null : stored === "true";
	} catch { return null; }
}

export function saveAssistantAvailability(enabled: boolean) {
	try { localStorage.setItem(STORAGE_KEY, String(enabled)); }
	catch { /* Storage is optional. */ }
}
