export type SystemMailInput = {
	to: string;
	subject: string;
	text: string;
	html?: string;
	/** Send from a mailbox on this domain instead of the first usable one. */
	hostname?: string;
};
