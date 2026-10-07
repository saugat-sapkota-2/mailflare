import { createDnsRecord, deleteDnsRecord, listMxRecords } from "@/lib/cloudflare-dns";
import type { CfDnsRecord } from "@/lib/cloudflare-api.types";
import type { CloudflareDnsRecordCreate } from "@/lib/cloudflare-dns.types";

function isCloudflareEmailRoutingMx(record: CfDnsRecord): boolean {
	return record.content?.toLowerCase().endsWith(".mx.cloudflare.net") ?? false;
}

function toCreateInput(record: CfDnsRecord): CloudflareDnsRecordCreate {
	if (!record.name || !record.content || record.priority === undefined) {
		throw new Error("Cloudflare returned an incomplete MX record");
	}

	return {
		type: "MX",
		name: record.name,
		content: record.content,
		priority: record.priority,
		ttl: record.ttl ?? 1,
		...(record.proxied === undefined ? {} : { proxied: record.proxied }),
		...(record.comment === undefined ? {} : { comment: record.comment }),
		...(record.tags === undefined ? {} : { tags: record.tags }),
	};
}

export async function removeMxRecords(
	env: CloudflareEnv,
	zoneId: string,
	hostname: string,
	deleted: CfDnsRecord[],
): Promise<void> {
	const records = (await listMxRecords(env, zoneId, hostname)).filter(
		(record) => !isCloudflareEmailRoutingMx(record),
	);

	for (const record of records) {
		if (!record.id) throw new Error("Cloudflare returned an MX record without an id");
		await deleteDnsRecord(env, zoneId, record.id);
		deleted.push(record);
	}
}

/** MX records on `hostname` that point somewhere other than Cloudflare Email Routing. */
export async function listConflictingMxRecords(
	env: CloudflareEnv,
	zoneId: string,
	hostname: string,
): Promise<CfDnsRecord[]> {
	const records = await listMxRecords(env, zoneId, hostname);
	return records.filter((record) => !isCloudflareEmailRoutingMx(record));
}

export async function hasConflictingMxRecords(
	env: CloudflareEnv,
	zoneId: string,
	hostname: string,
): Promise<boolean> {
	const records = await listMxRecords(env, zoneId, hostname);
	return records.some((record) => !isCloudflareEmailRoutingMx(record));
}

export async function restoreMxRecords(
	env: CloudflareEnv,
	zoneId: string,
	records: CfDnsRecord[],
): Promise<void> {
	for (const record of records) {
		await createDnsRecord(env, zoneId, toCreateInput(record));
	}
}
