import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { bookingUsernameFromEmail } from "./utils";

export async function ensureBookingUsername(env: CloudflareEnv, userId: string, email: string): Promise<string> {
	const db = getDb(env);
	const [current] = await db.select({ bookingUsername: users.bookingUsername }).from(users).where(eq(users.id, userId)).limit(1);
	if (!current) throw new Error("User not found");
	if (current.bookingUsername) return current.bookingUsername;
	const base = bookingUsernameFromEmail(email);
	for (let number = 1; number < 100_000; number++) {
		const candidate = number === 1 ? base : `${base}${number}`;
		const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.bookingUsername, candidate)).limit(1);
		if (taken) continue;
		try {
			const [updated] = await db.update(users).set({ bookingUsername: candidate }).where(and(eq(users.id, userId), isNull(users.bookingUsername))).returning({ bookingUsername: users.bookingUsername });
			if (updated?.bookingUsername) return updated.bookingUsername;
			const [assigned] = await db.select({ bookingUsername: users.bookingUsername }).from(users).where(eq(users.id, userId)).limit(1);
			if (assigned?.bookingUsername) return assigned.bookingUsername;
		} catch (error) {
			if (error instanceof Error && /UNIQUE constraint failed|users_booking_username_idx/i.test(error.message)) continue;
			throw error;
		}
	}
	throw new Error("Could not assign a booking username");
}
