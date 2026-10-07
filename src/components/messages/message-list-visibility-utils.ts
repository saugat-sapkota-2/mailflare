const STORAGE_KEY = "mailflare-message-list-visible";

export function readInitialMessageListVisible() {
	if (typeof window === "undefined") return true;
	try { return localStorage.getItem(STORAGE_KEY) !== "false"; }
	catch { return true; }
}

export function saveMessageListVisible(visible: boolean) {
	try { localStorage.setItem(STORAGE_KEY, String(visible)); }
	catch { /* Storage is optional. */ }
}
