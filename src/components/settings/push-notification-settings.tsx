"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
	disablePushNotifications,
	enablePushNotifications,
	getPushState,
} from "@/lib/push/client";

type State = {
	loading: boolean;
	supported: boolean;
	configured: boolean;
	permission: NotificationPermission | "unsupported";
	subscribed: boolean;
	error: string | null;
};

const initialState: State = {
	loading: true,
	supported: false,
	configured: false,
	permission: "unsupported",
	subscribed: false,
	error: null,
};

export function PushNotificationSettings() {
	const [state, setState] = useState<State>(initialState);

	useEffect(() => {
		let cancelled = false;
		getPushState()
			.then((next) => {
				if (!cancelled) setState({ ...next, loading: false, error: null });
			})
			.catch((error) => {
				if (!cancelled) {
					setState((current) => ({
						...current,
						loading: false,
						error: error instanceof Error ? error.message : "Failed to load notification settings",
					}));
				}
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const disabled =
		state.loading ||
		!state.supported ||
		(!state.configured && !state.subscribed) ||
		(state.permission === "denied" && !state.subscribed);
	let description = "Get new mail alerts even when Mailflare is closed.";
	if (!state.supported) description = "This browser does not support Web Push for Mailflare.";
	else if (!state.configured) description = "Web Push has not been configured on this Mailflare server.";
	else if (state.permission === "denied") description = "Notifications are blocked in your browser settings.";

	return (
		<div>
			<label className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
				<span className="flex-1">
					<span className="block text-sm font-medium text-neutral-900">Browser push notifications</span>
					<span className="mt-1 block text-sm text-neutral-500">{description}</span>
				</span>
				<Switch
					checked={state.subscribed}
					disabled={disabled}
					onCheckedChange={(enabled) => {
						setState((current) => ({ ...current, loading: true, error: null }));
						void (enabled ? enablePushNotifications() : disablePushNotifications())
							.then(() => getPushState())
							.then((next) => setState({ ...next, loading: false, error: null }))
							.catch((error) => {
								setState((current) => ({
									...current,
									loading: false,
									error: error instanceof Error ? error.message : "Failed to update notifications",
								}));
							});
					}}
					aria-label="Enable browser push notifications"
				/>
			</label>
			{state.error && <p className="mt-2 px-4 text-sm text-red-600">{state.error}</p>}
		</div>
	);
}
