"use client";

import { useEffect } from "react";
import { applyTheme, readThemePreference, THEME_CHANGED_EVENT } from "@/components/theme-utils";

// Keeps the html class in step with the saved preference and, for "system", with the OS setting.
export function ThemeSync() {
	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const sync = () => applyTheme(readThemePreference());
		sync();
		media.addEventListener("change", sync);
		window.addEventListener(THEME_CHANGED_EVENT, sync);
		window.addEventListener("storage", sync);
		return () => {
			media.removeEventListener("change", sync);
			window.removeEventListener(THEME_CHANGED_EVENT, sync);
			window.removeEventListener("storage", sync);
		};
	}, []);
	return null;
}
