import { useCallback, useLayoutEffect, useState } from "react";

const STORAGE_KEY = "mailflare-two-column-reading";
const CHANGE_EVENT = "mailflare:two-column-reading-changed";

function readStored() {
	try {
		return localStorage.getItem(STORAGE_KEY) !== "off";
	} catch {
		return true;
	}
}

export function useTwoColumnReading(): [boolean, (enabled: boolean) => void] {
	const [enabled, setEnabled] = useState(true);

	useLayoutEffect(() => {
		const sync = () => setEnabled(readStored());
		sync();
		window.addEventListener(CHANGE_EVENT, sync);
		window.addEventListener("storage", sync);
		return () => {
			window.removeEventListener(CHANGE_EVENT, sync);
			window.removeEventListener("storage", sync);
		};
	}, []);

	const update = useCallback((next: boolean) => {
		try {
			localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
		} catch {
			// The preference still applies until this page is closed.
		}
		setEnabled(next);
		window.dispatchEvent(new Event(CHANGE_EVENT));
	}, []);

	return [enabled, update];
}
