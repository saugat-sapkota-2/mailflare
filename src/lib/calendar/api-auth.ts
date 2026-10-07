import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { authenticateApiRequest, hasScope } from "@/lib/api/key-auth";
import type { ApiAuthResult } from "@/lib/api/key-auth-types";
import type { CalendarAuthorization } from "./api-auth-types";

export async function authorizeCalendarRequest(env: CloudflareEnv, request: Request, scope: "calendar:read" | "calendar:write"): Promise<CalendarAuthorization> {
	const authorization = request.headers.get("Authorization") ?? "";
	if (authorization.startsWith("Bearer ep_") || authorization.startsWith("Basic ")) {
		const key = await authenticateApiRequest(env, request);
		if (!key) return { user: null, key: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
		if (!hasScope(key.scopes, scope)) return { user: null, key: null, error: NextResponse.json({ error: "Permission denied" }, { status: 403 }) };
		return { user: key.user, key, error: null };
	}
	const user = await getCurrentUser(env, request);
	return user
		? { user, key: null, error: null }
		: { user: null, key: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
}

export function calendarKeyCanSendInvitations(key: ApiAuthResult | null, mailboxId: string | null | undefined): boolean {
	return !key || !!mailboxId && hasScope(key.scopes, "send") && (key.mailboxIds === null || key.mailboxIds.includes(mailboxId));
}
