export type AwsCredentials = {
	accessKeyId: string;
	secretAccessKey: string;
	sessionToken?: string;
};

export type AwsConfig = AwsCredentials & {
	region: string;
};

export type AwsConfigStatus = {
	configured: boolean;
	source: "settings" | "environment" | null;
	region: string | null;
	/** Last four characters of the access key id, for display. */
	accessKeyHint: string | null;
	accountId: string | null;
};

export type AwsCapabilityReport = {
	accountId: string;
	arn: string;
	region: string;
	/** SES can send (ses:GetAccount). */
	sending: boolean;
	/** The account is out of the SES sandbox; sandbox accounts reach verified recipients only. */
	productionAccess: boolean | null;
	/** SES inbound is offered in this region. */
	receivingRegion: boolean;
	receiving: boolean;
	sns: boolean;
	s3: boolean;
	/** Capabilities the key lacks, as AWS actions, for the admin to grant. */
	missing: string[];
};

export type SesReceivingState = {
	region: string;
	bucket: string;
	topicArn: string;
	ruleSet: string;
	/** Secret in the SNS endpoint URL. */
	token: string;
	endpoint: string;
	accountId: string;
};

export type SesIdentityStatus = {
	registered: boolean;
	verified: boolean;
	dkimStatus: string;
	records: { type: "CNAME"; name: string; value: string }[];
};
