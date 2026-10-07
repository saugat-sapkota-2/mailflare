"use client";

import { useSyncExternalStore } from "react";

const mobileQuery = "(max-width: 767px)";

export function isMobileViewport(): boolean {
	return window.matchMedia(mobileQuery).matches;
}

export function useIsMobile(): boolean {
	return useSyncExternalStore(
		(onChange) => {
			const media = window.matchMedia(mobileQuery);
			media.addEventListener("change", onChange);
			return () => media.removeEventListener("change", onChange);
		},
		isMobileViewport,
		() => false,
	);
}
