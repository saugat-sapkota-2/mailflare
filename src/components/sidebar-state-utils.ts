const SIDEBAR_MINIMAL_STORAGE_KEY = "mailflare-sidebar-minimal";

export const sidebarBootstrapScript = `(() => {
	try {
		const minimalKey = "mailflare-sidebar-minimal";
		const widthKey = "mailflare-column-width:sidebar";
		let minimal = localStorage.getItem(minimalKey);
		let width = localStorage.getItem(widthKey);
		if (minimal === null) {
			const keys = Object.keys(localStorage).filter((key) => key.startsWith(minimalKey + ":"));
			if (keys.length === 1) minimal = localStorage.getItem(keys[0]);
		}
		if (width === null) {
			const keys = Object.keys(localStorage).filter((key) => key.startsWith(widthKey + ":"));
			if (keys.length === 1) width = localStorage.getItem(keys[0]);
		}
		if (minimal === "true") document.documentElement.style.setProperty("--persisted-sidebar-width", "72px");
		else if (width !== null && Number.isFinite(Number(width))) document.documentElement.style.setProperty("--persisted-sidebar-width", Math.max(200, Math.min(480, Number(width))) + "px");
	} catch {}
})();`;

export function syncInitialSidebarWidth(width: number, minimal: boolean): void {
	if (typeof document === "undefined") return;
	document.documentElement.style.setProperty("--persisted-sidebar-width", `${minimal ? 72 : width}px`);
}

export function readInitialSidebarMinimal(): boolean {
	if (typeof window === "undefined") return false;
	try {
		const saved = localStorage.getItem(SIDEBAR_MINIMAL_STORAGE_KEY);
		if (saved !== null) return saved === "true";
		const userKeys = Object.keys(localStorage).filter((key) => key.startsWith(`${SIDEBAR_MINIMAL_STORAGE_KEY}:`));
		return userKeys.length === 1 && localStorage.getItem(userKeys[0]) === "true";
	} catch {
		return false;
	}
}

export function saveInitialSidebarMinimal(minimal: boolean): void {
	try {
		localStorage.setItem(SIDEBAR_MINIMAL_STORAGE_KEY, String(minimal));
	} catch {
		// Storage can be unavailable in private windows.
	}
}
