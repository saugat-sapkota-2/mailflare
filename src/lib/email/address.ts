import type { Address, Mailbox } from "postal-mime";
import type { EmailAddressParts } from "@/lib/email/address-types";
import { parseAddress } from "@/lib/utils";

function quoteDisplayName(name: string): string {
	return `"${name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function formatEmailAddress(address: string, name?: string | null): string {
	const normalizedAddress = address.trim();
	const normalizedName = name?.trim();

	if (!normalizedName) return normalizedAddress;
	return `${quoteDisplayName(normalizedName)} <${normalizedAddress}>`;
}

export function parseEmailAddressParts(value: string): EmailAddressParts {
	const trimmed = value.trim();
	const headerMatch = trimmed.match(/^(?:"([^"]+)"|([^<"]+))\s*<([^>]+)>$/);

	if (headerMatch) {
		return {
			name: (headerMatch[1] ?? headerMatch[2] ?? "").trim() || null,
			address: headerMatch[3].trim(),
		};
	}

	return { name: null, address: trimmed };
}

export function getEmailAddress(value: string): string {
	return parseEmailAddressParts(value).address;
}

export function normalizeEmailAddress(value: string): string {
	return getEmailAddress(value).trim().toLowerCase();
}

export function getEmailDisplayName(value: string): string {
	const parts = parseEmailAddressParts(value);
	if (parts.name) return parts.name;

	const parsed = parseAddress(parts.address);
	return parsed?.local || parts.address;
}

export function formatPostalAddress(address: Address | undefined, fallback: string | null): string | null {
	const mailbox = getFirstPostalMailbox(address);
	if (!mailbox?.address) return fallback;

	return formatEmailAddress(mailbox.address, mailbox.name);
}

export function formatPostalAddressList(addresses: Address[] | undefined, fallback: string | null): string | null {
	const mailbox = addresses?.map(getFirstPostalMailbox).find((item): item is Mailbox => !!item?.address);
	if (!mailbox?.address) return fallback;

	return formatEmailAddress(mailbox.address, mailbox.name);
}

function getFirstPostalMailbox(address: Address | undefined): Mailbox | null {
	if (!address) return null;
	if ("address" in address && address.address) return address;
	return address.group ? address.group[0] : null;
}
