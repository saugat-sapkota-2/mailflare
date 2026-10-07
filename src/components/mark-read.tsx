"use client";

import { useEffect } from "react";
import { authFetch } from "@/lib/auth/client";
import { markMessagesReadInCaches } from "@/hooks/utils";

export function MarkAsRead({ messageId }: { messageId: string }) {
	useEffect(() => {
		authFetch(`/api/messages/${messageId}/read`, { method: "POST" })
			.then((response) => {
				if (!response.ok) return;
				markMessagesReadInCaches([messageId], true);
				window.dispatchEvent(new Event("mailflare:messages-changed"));
			})
			.catch(() => {
				// silently fail
			});
	}, [messageId]);

	return null;
}
