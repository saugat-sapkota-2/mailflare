"use client";

import { useEffect } from "react";
import { registerMailflareServiceWorker } from "@/lib/push/client";

export function PwaServiceWorker() {
	useEffect(() => {
		if (!("serviceWorker" in navigator)) return;
		void registerMailflareServiceWorker().catch((error) => {
			console.warn("Mailflare service worker registration failed", error);
		});
	}, []);

	return null;
}
