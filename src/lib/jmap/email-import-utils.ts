import { KEYWORD_FLAGGED, KEYWORD_SEEN } from "./constants";
import { decodeMailboxRef } from "./ids";
import type { JmapSetError } from "./types";

/**
 * A JMAP Id[Boolean] set, as `mailboxIds` and `keywords` are defined. Clients
 * built on libraries that model these as lists send a plain array instead, so
 * both shapes are read; only entries set to true count.
 */
export function idSetToList(value: unknown): string[] {
	if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
	if (!value || typeof value !== "object") return [];
	return Object.entries(value as Record<string, unknown>).filter(([, on]) => !!on).map(([id]) => id);
}

/** The keywords Mailflare stores as columns. `$draft` is implied by the Drafts-only rule, and unknown keywords are ignored. */
export function importFlags(keywords: unknown): { read: boolean; starred: boolean } {
	const set = new Set(idSetToList(keywords));
	return { read: set.has(KEYWORD_SEEN), starred: set.has(KEYWORD_FLAGGED) };
}

/**
 * `receivedAt` is a UTCDate in RFC 8621, but client libraries also send epoch
 * seconds or milliseconds. Anything unusable falls back to the caller's default.
 */
export function parseReceivedAt(value: unknown): Date | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		// Seconds until the value is too large to be one: 1e12 is the year 33658 in seconds.
		const date = new Date(value < 1e12 ? value * 1000 : value);
		return Number.isNaN(date.getTime()) ? null : date;
	}
	if (typeof value !== "string" || !value.trim()) return null;
	const date = new Date(value.trim());
	return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Where a new message may be created: exactly one JMAP Mailbox, and it must be
 * a Drafts role mailbox the key can write to. Importing into arbitrary mailboxes
 * would have to answer for threading, spam scoring and inbound state, so v1
 * takes the same target `Email/set` create does.
 */
export function resolveDraftsMailbox(mailboxIds: unknown, writable: Set<string>): { mailboxId: string } | { error: JmapSetError } {
	const ids = idSetToList(mailboxIds);
	const invalid = (description: string) => ({ error: { type: "invalidProperties", properties: ["mailboxIds"], description } });
	if (ids.length !== 1) return invalid("A message belongs to exactly one mailbox");
	const ref = decodeMailboxRef(ids[0]);
	if (!ref || !writable.has(ref.mailboxId)) return invalid("Unknown mailbox");
	if (ref.kind !== "role" || ref.role !== "drafts") return invalid("New messages can only be created in a Drafts mailbox");
	return { mailboxId: ref.mailboxId };
}
