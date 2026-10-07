"use client";

import { MailboxProvider } from "@/components/mailbox-provider";
import { MailboxSelector } from "@/components/mailbox-selector";
import type { HomeAccountMenuProps } from "./types";

export function HomeAccountMenu({ user }: HomeAccountMenuProps) {
	return (
		<MailboxProvider>
			<MailboxSelector initialUser={user} />
		</MailboxProvider>
	);
}
