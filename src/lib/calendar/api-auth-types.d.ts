import type { NextResponse } from "next/server";
import type { users } from "@/db/schema";
import type { ApiAuthResult } from "@/lib/api/key-auth-types";

export type CalendarAuthorization =
	| { user: typeof users.$inferSelect; key: ApiAuthResult | null; error: null }
	| { user: null; key: null; error: NextResponse };
