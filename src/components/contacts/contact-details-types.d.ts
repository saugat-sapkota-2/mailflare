export type ContactDetailsRecord = {
	email: string;
	displayName: string | null;
	hasAvatar: boolean;
	source: "manual" | "inbound" | "outbound" | null;
	blocked: boolean;
	lastSeenAt: string | null;
};

export type ContactDetailsResponse = {
	contact?: ContactDetailsRecord;
	error?: string;
};

export type ContactDetailsTriggerProps = {
	mailboxId: string | null;
	address: string;
	/** Contact name. Not the formatted Name <mailbox> label. */
	name: string;
	/** Visible text. Falls back to name. */
	label?: string;
	className?: string;
};
