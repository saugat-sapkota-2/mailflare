"use client";

import { useCallback, useEffect, useState } from "react";
import { loadShowFullRecipientAddresses, updateShowFullRecipientAddresses } from "./use-show-full-recipient-addresses-utils";

/** The signed-in user's choice for To, Cc, and Bcc. Default is the mailbox only. */
export function useShowFullRecipientAddresses() {
	const [enabled, setEnabledState] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		loadShowFullRecipientAddresses()
			.then((stored) => {
				if (!cancelled) setEnabledState(stored);
			})
			.catch((loadError) => {
				if (cancelled) return;
				setError(loadError instanceof Error ? loadError.message : "Failed to load recipient address settings");
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const setEnabled = useCallback(async (next: boolean) => {
		const previous = enabled;
		setEnabledState(next);
		setError(null);
		try {
			setEnabledState(await updateShowFullRecipientAddresses(next));
		} catch (updateError) {
			setEnabledState(previous);
			const message = updateError instanceof Error ? updateError.message : "Failed to update recipient address settings";
			setError(message);
			throw new Error(message);
		}
	}, [enabled]);

	return { enabled, error, isLoading, setEnabled };
}
