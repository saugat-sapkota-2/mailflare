"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/client";
import type { AuthGuardProps } from "./auth-guard-types";
import { LoadingTransition } from "@/components/loading-transition";
import { saveUserTimeZonePreference } from "@/lib/time/client";

export function AuthGuard({ children, mode = "protected", requireMailbox, requireRole, requirePrimary, allowAuthenticated }: AuthGuardProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [authorized, setAuthorized] = useState(mode === "public");

	useEffect(() => {
		let cancelled = false;

		async function checkSession() {
			try {
				const cookieResponse = await fetch("/api/auth/me", {
					cache: "no-store",
					signal: AbortSignal.timeout(5_000),
				});
				const response = cookieResponse.ok || cookieResponse.status !== 401
					? cookieResponse
					: await authFetch("/api/auth/me", {
						redirectOnUnauthorized: false,
						signal: AbortSignal.timeout(5_000),
					});
				if (cancelled) return;

				if (!response.ok) {
					if (mode === "protected" && response.status === 401) router.replace("/login");
					else setAuthorized(true);
					return;
				}

				const data = (await response.json()) as { hasMailboxes?: boolean; isSetup?: boolean; user?: { id?: string; role?: string; isPrimaryAdmin?: boolean; timeZone?: string | null } };
				if (data.user?.id) saveUserTimeZonePreference(data.user.id, data.user.timeZone ?? null);
				if (mode === "public") {
					if (!allowAuthenticated) router.replace("/inbox");
					return;
				}

				if (requireMailbox && data.hasMailboxes === false && data.user?.role === "admin" && data.isSetup === false && pathname !== "/setup") {
					router.replace("/setup");
					return;
				}

				if (pathname === "/setup" && data.isSetup === true) {
					router.replace("/inbox");
					return;
				}

				if (requireRole && data.user?.role !== requireRole) {
					router.replace("/inbox");
					return;
				}

				if (requirePrimary && !data.user?.isPrimaryAdmin) {
					router.replace("/admin");
					return;
				}

				setAuthorized(true);
			} catch {
				if (!cancelled) setAuthorized(true);
			}
		}

		void checkSession();

		return () => {
			cancelled = true;
		};
	}, [mode, pathname, requireMailbox, requireRole, requirePrimary, allowAuthenticated, router]);

	useEffect(() => {
		const refreshTimeZone = (event: StorageEvent) => {
			if (event.key === "mailflare-user-time-zone") window.location.reload();
		};
		window.addEventListener("storage", refreshTimeZone);
		return () => window.removeEventListener("storage", refreshTimeZone);
	}, []);

	if (mode === "public") return <>{children}</>;
	return <LoadingTransition ready={authorized}>{children}</LoadingTransition>;
}
