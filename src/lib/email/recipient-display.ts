import { getEmailAddress, parseEmailAddressParts, splitEmailAddressList } from "@/lib/email/address";

/** address: mailbox only. full: Name <mailbox> when the header has a display name. */
export type RecipientAddressStyle = "address" | "full";

export function formatRecipientAddress(entry: string, style: RecipientAddressStyle): string {
	const address = getEmailAddress(entry).trim();
	if (!address) return entry.trim();
	if (style !== "full") return address;
	const name = parseEmailAddressParts(entry).name?.trim();
	if (!name) return address;
	return `${name} <${address}>`;
}

export function formatRecipientAddressList(value: string | null | undefined, style: RecipientAddressStyle): string {
	return splitEmailAddressList(value)
		.map((entry) => formatRecipientAddress(entry, style))
		.join(", ");
}

/** Name to store on a contact. Never the formatted Name <mailbox> label. */
export function recipientContactName(entry: string): string {
	return parseEmailAddressParts(entry).name?.trim() || getEmailAddress(entry).trim() || entry.trim();
}
