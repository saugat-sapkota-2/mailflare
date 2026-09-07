export type Domain = {
	id: string;
	hostname: string;
	status: string;
	routingEnabled: boolean;
	sendingEnabled: boolean;
	zoneId: string;
};

export type DnsRecord = {
	type?: string;
	name?: string;
	content?: string;
	priority?: number;
};

export type DnsStatusSummary = {
	routing: { configured: boolean; missing: string[] };
	sending: { configured: boolean; records: string[] };
};

export type DomainDnsView = {
	routing: {
		records: DnsRecord[];
		missing: DnsRecord[];
		status?: string;
	};
	sending: DnsRecord[];
	sendingEnabled: boolean;
};

export type DomainDnsDetailsProps = {
	domain: Domain;
	dns: DomainDnsView;
};
