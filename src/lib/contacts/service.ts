import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { contacts, routingRules } from "@/db/schema";
import { normalizeEmailAddress } from "@/lib/email/address";
import type { BlockContactInput, ContactInput, MessageContactNames } from "@/lib/contacts/types";
import { getContactId, getContactNameFromAddress } from "@/lib/contacts/utils";

export async function upsertContactFromAddress(env: CloudflareEnv, input: ContactInput) {
	const email = normalizeEmailAddress(input.address);
	if (!email) return null;

	const displayName = getContactNameFromAddress(input.address);
	const db = getDb(env);
	const [existing] = await db
		.select()
		.from(contacts)
		.where(and(eq(contacts.userId, input.userId), eq(contacts.email, email)))
		.limit(1);
	const now = new Date();

	if (existing) {
		const nextDisplayName = getNextDisplayName(existing.displayName, existing.source, displayName);
		const nextSource = existing.source === "manual" ? "manual" : input.source;

		await db
			.update(contacts)
			.set({
				displayName: nextDisplayName,
				source: nextSource,
				lastSeenAt: now,
			})
			.where(eq(contacts.id, existing.id));
		return { ...existing, displayName: nextDisplayName, source: nextSource, lastSeenAt: now };
	}

	const id = getContactId(input.userId, email);
	await db.insert(contacts).values({
		id,
		userId: input.userId,
		email,
		displayName,
		source: input.source,
		lastSeenAt: now,
	});

	const [created] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
	return created ?? null;
}

export async function getContactDisplayNameMap(env: CloudflareEnv, userId: string, addresses: string[]) {
	const emails = Array.from(new Set(addresses.map(normalizeEmailAddress).filter(Boolean)));
	if (emails.length === 0) return new Map<string, string>();

	const db = getDb(env);
	const rows = await db
		.select()
		.from(contacts)
		.where(and(eq(contacts.userId, userId), inArray(contacts.email, emails)));

	return new Map(
		rows
			.filter((contact) => !!contact.displayName)
			.map((contact) => [contact.email, contact.displayName!]),
	);
}

export async function getMessageContactNames(
	env: CloudflareEnv,
	userId: string,
	fromAddr: string,
	toAddr: string,
): Promise<MessageContactNames> {
	const contactMap = await getContactDisplayNameMap(env, userId, [fromAddr, toAddr]);

	return {
		fromContactName: contactMap.get(normalizeEmailAddress(fromAddr)) ?? null,
		toContactName: contactMap.get(normalizeEmailAddress(toAddr)) ?? null,
	};
}

export async function blockContact(env: CloudflareEnv, input: BlockContactInput) {
	const email = normalizeEmailAddress(input.address);
	if (!email) throw new Error("Contact email is required");

	const db = getDb(env);
	const contactId = getContactId(input.userId, email);
	const [existingContact] = await db
		.select()
		.from(contacts)
		.where(and(eq(contacts.userId, input.userId), eq(contacts.email, email)))
		.limit(1);
	if (existingContact) {
		await db.update(contacts).set({ blocked: true }).where(eq(contacts.id, existingContact.id));
	} else {
		await db.insert(contacts).values({
			id: contactId,
			userId: input.userId,
			email,
			displayName: getContactNameFromAddress(input.address),
			source: "inbound",
			blocked: true,
			lastSeenAt: new Date(),
		});
	}

	const [existingRule] = await db
		.select()
		.from(routingRules)
		.where(
			and(
				eq(routingRules.mailboxId, input.mailboxId),
				eq(routingRules.matchField, "email"),
				eq(routingRules.matchOperator, "exact"),
				eq(routingRules.matchValue, email),
				eq(routingRules.action, "trash"),
			),
		)
		.limit(1);
	if (!existingRule) {
		await db.insert(routingRules).values({
			id: `block:${input.mailboxId}:${email}`,
			userId: input.userId,
			domainId: input.domainId,
			pattern: email,
			matchField: "email",
			matchOperator: "exact",
			matchValue: email,
			mailboxId: input.mailboxId,
			action: "trash",
			priority: 100,
		});
	}

	return { email, blocked: true };
}

function getNextDisplayName(existingName: string | null, source: string, nextName: string | null): string | null {
	if (source === "manual") return existingName;
	if (nextName) return nextName;
	return existingName;
}
