export type ResendDomainView = {
	registered: boolean;
	/** Resend's status (verified, pending, failed, ...) or "not_registered". */
	status: string;
	records: {
		record: string;
		type: "MX" | "TXT" | "CNAME";
		name: string;
		value: string;
		priority: number | null;
		status: string;
	}[];
	/** Mailflare can write the records to the Cloudflare zone itself. */
	dnsManaged: boolean;
	/** Records Resend asked for that are not in the Cloudflare zone; null when DNS is manual or unchecked. */
	missingDns: number | null;
};
