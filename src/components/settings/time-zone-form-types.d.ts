export type TimeZoneFormProps = {
	userId: string;
	initialTimeZone: string | null;
};

export type TimeZoneUpdateResponse = {
	timeZone?: string | null;
	error?: string;
};
