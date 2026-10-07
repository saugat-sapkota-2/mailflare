export type AuthenticationSummary = {
	status: string;
	detail: string | null;
};

export type MessageSourceSummary = {
	messageId: string | null;
	createdAt: string | null;
	from: string | null;
	to: string | null;
	subject: string | null;
	spf: AuthenticationSummary | null;
	dkim: AuthenticationSummary | null;
	dmarc: AuthenticationSummary | null;
};
