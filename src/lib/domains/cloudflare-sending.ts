import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { domains } from "@/db/schema";
import { deleteSendingSubdomain, listSendingSubdomains } from "@/lib/cloudflare-api";
import { isManualZone } from "@/lib/domains/provision";
import { findSendingSubdomain } from "@/lib/domains/sending-status";
import type { DomainRow } from "@/lib/domains/types";

/** The zone's Cloudflare Email Sending subdomain for this domain, if one exists. */
export async function findCloudflareSending(env: CloudflareEnv, domain: DomainRow) {
	if (isManualZone(domain.zoneId)) return null;
	try { return findSendingSubdomain(domain.hostname, await listSendingSubdomains(env, domain.zoneId)); }
	catch { return null; }
}

/** Removes the Cloudflare sending subdomain (and with it the DNS Cloudflare created for it). */
export async function removeCloudflareSending(env: CloudflareEnv, domain: DomainRow): Promise<void> {
	const subdomain = await findCloudflareSending(env, domain);
	if (subdomain) await deleteSendingSubdomain(env, domain.zoneId, subdomain.tag);
	await getDb(env)
		.update(domains)
		.set({ sendingSubdomainTag: null, sendingEnabled: false, sendingRequested: false })
		.where(eq(domains.id, domain.id));
}
