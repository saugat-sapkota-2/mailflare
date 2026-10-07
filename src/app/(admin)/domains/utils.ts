import type { TranslationKey } from "@/lib/i18n/types";
import { defaultTranslator, type Translator } from "@/lib/i18n/utils";
import { authFetch } from "@/lib/auth/client";
import type { DnsAuthRecord, DnsAuthStatus, DomainPreflightResponse } from "./types";

export const dnsAuthRecords: DnsAuthRecord[] = ["mx", "spf", "dkim", "dmarc"];

export const dnsAuthDescriptions = {
	mx: "dns.mx",
	spf: "dns.spf",
	dkim: "dns.dkim",
	dmarc: "dns.dmarc",
} satisfies Record<DnsAuthRecord, TranslationKey>;

export function getDnsAuthStatusLabel(status: DnsAuthStatus, t: Translator = defaultTranslator): string {
	switch (status) {
		case "ok":
			return t("dns.found");
		case "missing":
			return t("dns.missing");
		default:
			return t("dns.notVerified");
	}
}

export function getDnsAuthItemClass(status: DnsAuthStatus): string {
	switch (status) {
		case "ok":
			return "bg-green-50 text-green-800";
		case "missing":
			return "bg-red-50 text-red-800";
		default:
			return "bg-neutral-100 text-neutral-600";
	}
}

export async function checkDomain(hostname: string): Promise<DomainPreflightResponse> {
	const response = await authFetch("/api/domains/check", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ hostname }),
	});
	const data = (await response.json()) as Omit<DomainPreflightResponse, "ok">;
	return { ok: response.ok, ...data };
}
