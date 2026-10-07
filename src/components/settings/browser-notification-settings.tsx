"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Switch } from "@/components/ui/switch";
import {
	areBrowserNotificationsEnabled,
	setBrowserNotificationsEnabled,
} from "@/hooks/message-realtime-utils";

export function BrowserNotificationSettings() {
	const { t } = useLanguage();
	const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
	const [enabled, setEnabled] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const refresh = () => {
			setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
			setEnabled(areBrowserNotificationsEnabled());
		};
		refresh();
		window.addEventListener("focus", refresh);
		window.addEventListener("storage", refresh);
		return () => {
			window.removeEventListener("focus", refresh);
			window.removeEventListener("storage", refresh);
		};
	}, []);

	return (
		<div>
			<label className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
				<span className="flex-1">
					<span className="block text-sm font-medium text-neutral-900">{t("settings.notifications.title")}</span>
					<span className="mt-1 block text-sm text-neutral-500">
						{t("settings.notifications.description")}
					</span>
				</span>
				<Switch
					checked={permission === "granted" && enabled}
					disabled={permission === "unsupported" || permission === "denied"}
					onCheckedChange={(nextEnabled) => {
						setError(null);
						if (!nextEnabled) {
							try {
								setBrowserNotificationsEnabled(false);
								setEnabled(false);
							} catch {
								setError(t("settings.notifications.saveFailed"));
							}
							return;
						}
						void (async () => {
							try {
								const nextPermission = permission === "granted" ? permission : await Notification.requestPermission();
								setPermission(nextPermission);
								if (nextPermission !== "granted") return;
								setBrowserNotificationsEnabled(true);
								setEnabled(true);
							} catch {
								setError(t("settings.notifications.enableFailed"));
							}
						})();
					}}
					aria-label={t("settings.notifications.enable")}
				/>
			</label>
			{permission === "denied" && (
				<p className="mt-2 px-4 text-sm text-neutral-500">{t("settings.notifications.blocked")}</p>
			)}
			{permission === "unsupported" && (
				<p className="mt-2 px-4 text-sm text-neutral-500">{t("settings.notifications.unavailable")}</p>
			)}
			{error && <p className="mt-2 px-4 text-sm text-red-600">{error}</p>}
		</div>
	);
}
