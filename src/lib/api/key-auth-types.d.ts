import type { users } from "@/db/schema";

export type ApiAuthResult = {
	userId: string;
	email: string;
	scopes: string[];
	mailboxIds: string[] | null;
	user: typeof users.$inferSelect;
};
