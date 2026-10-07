"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/client";
import type { MailboxSelectorUser } from "@/components/mailbox-selector-types";
import type { HomeAuthProviderProps, HomeAuthResponse } from "./types";

const HomeAuthContext = createContext<MailboxSelectorUser | null>(null);

export function HomeAuthProvider({ children }: HomeAuthProviderProps) {
	const [user, setUser] = useState<MailboxSelectorUser | null>(null);

	useEffect(() => {
		let cancelled = false;
		void authFetch("/api/auth/me", { redirectOnUnauthorized: false })
			.then(async (response) => response.ok ? await response.json() as HomeAuthResponse : null)
			.then((data) => {
				if (!cancelled) setUser(data?.user ?? null);
			})
			.catch(() => {
				if (!cancelled) setUser(null);
			});
		return () => { cancelled = true; };
	}, []);

	return <HomeAuthContext.Provider value={user}>{children}</HomeAuthContext.Provider>;
}

export function useHomeAuth() {
	return useContext(HomeAuthContext);
}
