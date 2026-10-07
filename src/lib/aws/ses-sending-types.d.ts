export type SesSendingView = {
	registered: boolean;
	verified: boolean;
	dkimStatus: string;
	records: { type: "CNAME"; name: string; value: string }[];
	dnsManaged: boolean;
	missingDns: number | null;
	/** False while the account is in the SES sandbox. */
	productionAccess: boolean | null;
	region: string;
};
