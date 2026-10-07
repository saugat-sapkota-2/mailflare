import { createSendingSubdomain, listSendingSubdomains } from "@/lib/cloudflare-api";
import { CloudflareApiError, isCloudflareApiErrorCode } from "@/lib/cloudflare-api-error";
import type { CfDnsRecord, CfSendingSubdomain } from "@/lib/cloudflare-api.types";
import { listConflictingMxRecords, removeMxRecords } from "@/lib/domains/mx-records";
import { MxConflictError } from "@/lib/domains/receiving-dns";
import { findSendingSubdomain } from "@/lib/domains/sending-status";

/**
 * What Cloudflare answers when a sending subdomain is created on a hostname
 * whose MX records point at another mail service: a 401 "Unauthorized", which
 * reads like a bad token even when the token has every permission it needs.
 */
const SENDING_UNAUTHORIZED_CODE = 2036;

export const SENDING_MX_CONFLICT_MESSAGE =
	"Cloudflare Email Sending cannot be enabled while this domain has MX records for another mail service. Replace them to send with Cloudflare.";

function isSendingUnauthorized(error: unknown): boolean {
	return isCloudflareApiErrorCode(error, SENDING_UNAUTHORIZED_CODE) || (error instanceof CloudflareApiError && error.status === 401);
}

/**
 * Returns the zone's sending subdomain for `hostname`, creating it when missing.
 * When Cloudflare refuses because of another service's MX records, this throws
 * MxConflictError unless `replaceMx` is set, in which case it deletes them (pushing
 * them onto `deletedMx` so a rollback can restore them) and tries again.
 */
export async function ensureSendingSubdomain(
	env: CloudflareEnv,
	zoneId: string,
	hostname: string,
	options: { replaceMx?: boolean; deletedMx?: CfDnsRecord[] } = {},
): Promise<{ subdomain: CfSendingSubdomain; created: boolean }> {
	const existing = findSendingSubdomain(hostname, await listSendingSubdomains(env, zoneId));
	if (existing) return { subdomain: existing, created: false };

	try {
		return { subdomain: await createSendingSubdomain(env, zoneId, hostname), created: true };
	} catch (error) {
		if (!isSendingUnauthorized(error)) throw error;
		const conflicting = await listConflictingMxRecords(env, zoneId, hostname).catch(() => []);
		// No foreign MX: the 401 really is about credentials, so keep Cloudflare's error.
		if (conflicting.length === 0) throw error;
		if (!options.replaceMx) {
			throw new MxConflictError(
				conflicting.map((record) => ({ content: record.content ?? "", priority: record.priority ?? 0 })),
				SENDING_MX_CONFLICT_MESSAGE,
			);
		}
		await removeMxRecords(env, zoneId, hostname, options.deletedMx ?? []);
		return { subdomain: await createSendingSubdomain(env, zoneId, hostname), created: true };
	}
}
