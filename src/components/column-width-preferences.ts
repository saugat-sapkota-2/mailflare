import type { ColumnWidthPreference } from "./column-width-preferences-types";

function storageKey(userId: string, column: ColumnWidthPreference) {
	return `mailflare-column-width:${column}:${userId}`;
}

function immediateStorageKey(column: ColumnWidthPreference) {
	return `mailflare-column-width:${column}`;
}

export function readInitialColumnWidth(column: ColumnWidthPreference, fallback: number, min: number, max: number) {
	if (typeof window === "undefined") return fallback;
	try {
		let stored = localStorage.getItem(immediateStorageKey(column));
		if (stored === null) {
			const prefix = `${immediateStorageKey(column)}:`;
			const userKeys = Object.keys(localStorage).filter((key) => key.startsWith(prefix));
			if (userKeys.length === 1) stored = localStorage.getItem(userKeys[0]);
		}
		if (stored === null) return fallback;
		const width = Number(stored);
		return Number.isFinite(width) ? Math.max(min, Math.min(max, width)) : fallback;
	} catch {
		return fallback;
	}
}

export function readColumnWidth(userId: string, column: ColumnWidthPreference, fallback: number, min: number, max: number) {
	try {
		const stored = localStorage.getItem(storageKey(userId, column));
		if (stored === null) return fallback;
		const width = Number(stored);
		return Number.isFinite(width) ? Math.max(min, Math.min(max, width)) : fallback;
	} catch {
		return fallback;
	}
}

export function saveColumnWidth(userId: string | null, column: ColumnWidthPreference, width: number) {
	try {
		localStorage.setItem(immediateStorageKey(column), String(width));
		if (userId) localStorage.setItem(storageKey(userId, column), String(width));
	} catch {
		// Storage can be unavailable; resizing still works for this session.
	}
}
