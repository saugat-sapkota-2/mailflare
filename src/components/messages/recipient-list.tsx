"use client";

import { ContactDetailsTrigger } from "@/components/contacts/contact-details";
import { getEmailAddress } from "@/lib/email/address";
import { formatRecipientAddress, recipientContactName, type RecipientAddressStyle } from "@/lib/email/recipient-display";

export function RecipientList({
	entries,
	mailboxId,
	style,
}: {
	entries: string[];
	mailboxId: string | null;
	style: RecipientAddressStyle;
}) {
	if (entries.length === 0) return <>—</>;
	return (
		<>
			{entries.map((entry, index) => (
				<span key={`${entry}-${index}`} title={getEmailAddress(entry)}>
					{index > 0 && ", "}
					<ContactDetailsTrigger
						mailboxId={mailboxId}
						address={entry}
						name={recipientContactName(entry)}
						label={formatRecipientAddress(entry, style)}
					/>
				</span>
			))}
		</>
	);
}
