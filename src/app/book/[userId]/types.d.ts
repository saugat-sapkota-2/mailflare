export type PublicBookingEvent = {
	id: string;
	slug: string;
	userId: string;
	name: string;
	description: string;
	durationMinutes: number;
	location: string;
	weekdays: number[] | string;
	startTime?: string;
	endTime?: string;
	timeZone: string;
};

export type BookingSlot = { startsAt: string; endsAt: string; localDate: string; time: string };
