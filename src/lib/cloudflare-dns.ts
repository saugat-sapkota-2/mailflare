import { cfRequest } from "@/lib/cloudflare-api";
import type { CfDnsRecord } from "@/lib/cloudflare-api.types";
import type { CloudflareDnsRecordCreate } from "@/lib/cloudflare-dns.types";

export async function listMxRecords(
	env: CloudflareEnv,
	zoneId: string,
	hostname: string,
): Promise<CfDnsRecord[]> {
	return cfRequest<CfDnsRecord[]>(
		env,
		`/zones/${zoneId}/dns_records?type=MX&name=${encodeURIComponent(hostname)}&per_page=5000`,
	);
}

export async function listDnsRecords(
	env: CloudflareEnv,
	zoneId: string,
	params: { type: string; name: string },
): Promise<CfDnsRecord[]> {
	return cfRequest<CfDnsRecord[]>(
		env,
		`/zones/${zoneId}/dns_records?type=${encodeURIComponent(params.type)}&name=${encodeURIComponent(params.name)}&per_page=5000`,
	);
}

export async function deleteDnsRecord(
	env: CloudflareEnv,
	zoneId: string,
	recordId: string,
): Promise<void> {
	await cfRequest<unknown>(env, `/zones/${zoneId}/dns_records/${recordId}`, {
		method: "DELETE",
	});
}

export async function createDnsRecord(
	env: CloudflareEnv,
	zoneId: string,
	record: CloudflareDnsRecordCreate,
): Promise<CfDnsRecord> {
	return cfRequest<CfDnsRecord>(env, `/zones/${zoneId}/dns_records`, {
		method: "POST",
		body: JSON.stringify(record),
	});
}
