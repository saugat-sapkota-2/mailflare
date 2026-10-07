import PostalMime from "postal-mime";
import { getDb } from "@/db";
import { getEmailAddressList, normalizeEmailAddress } from "@/lib/email/address";
import { getMailboxDomainAddresses } from "@/lib/mailboxes/domain-addresses";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import type { AgentToolContext } from "./types";
import type { messages } from "@/db/schema";

export async function getReplyRecipients(context: AgentToolContext, source: typeof messages.$inferSelect, replyAll: boolean) {
	let recipient = normalizeEmailAddress(source.fromAddr);
	if (source.rawR2Key) {
		const object = await context.env.BUCKET.get(source.rawR2Key);
		if (object) {
			const parsed = await PostalMime.parse(await object.arrayBuffer());
			const replyTo = parsed.replyTo?.flatMap((item) => "address" in item && item.address ? [item.address] : []).at(0);
			if (replyTo) recipient = replyTo.toLowerCase();
		}
	}
	if (!recipient.includes("@")) throw new Error("Source has no reply address");
	const access = await getMailboxAccessLevel(getDb(context.env), context.user, context.mailboxId);
	if (!access) throw new Error("Mailbox not found");
	const ownAddresses = new Set(await getMailboxDomainAddresses(getDb(context.env), access.mailbox));
	if (ownAddresses.has(recipient)) throw new Error("Cannot draft a reply to this mailbox");
	const cc = replyAll ? [...new Set([...getEmailAddressList(source.toAddr), ...getEmailAddressList(source.ccAddr)])].filter((address) => !ownAddresses.has(address) && address !== recipient).join(", ") : "";
	return { to: recipient, cc };
}
