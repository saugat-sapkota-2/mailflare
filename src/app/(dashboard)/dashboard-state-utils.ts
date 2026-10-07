const ASSISTANT_OPEN_KEY = "mailflare-dashboard:assistant-open";
const ASSISTANT_FULL_SIZE_KEY = "mailflare-dashboard:assistant-full-size";

export function readInitialAssistantPanelState() {
	if (typeof window === "undefined") return { open: false, fullSize: false };
	try {
		return {
			open: localStorage.getItem(ASSISTANT_OPEN_KEY) === "true",
			fullSize: localStorage.getItem(ASSISTANT_FULL_SIZE_KEY) === "true",
		};
	} catch { return { open: false, fullSize: false }; }
}

export function saveAssistantPanelState(open: boolean, fullSize: boolean, userPrefix: string | null) {
	try {
		localStorage.setItem(ASSISTANT_OPEN_KEY, String(open));
		localStorage.setItem(ASSISTANT_FULL_SIZE_KEY, String(fullSize));
		if (userPrefix) {
			localStorage.setItem(`${userPrefix}:assistant-open`, String(open));
			localStorage.setItem(`${userPrefix}:assistant-full-size`, String(fullSize));
		}
	} catch { /* Storage is optional. */ }
}
