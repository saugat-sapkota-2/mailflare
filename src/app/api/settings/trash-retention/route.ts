import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireSessionUser } from "@/lib/api/auth";
import { getEnv } from "@/lib/cloudflare";
import { normalizeTrashRetentionDays } from "@/lib/email/trash-retention-utils";
import type { UpdateTrashRetentionSettingsInput } from "./types";
import { parseUpdateTrashRetentionSettingsRequest } from "./utils";

export async function GET(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	return NextResponse.json({ days: normalizeTrashRetentionDays(auth.user.trashRetentionDays) });
}

export async function PATCH(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;

	let input: UpdateTrashRetentionSettingsInput;
	try {
		input = await parseUpdateTrashRetentionSettingsRequest(request);
	} catch (error) {
		return NextResponse.json({ error: error instanceof ZodError ? error.flatten() : "Invalid request" }, { status: 400 });
	}

	await getDb(env)
		.update(users)
		.set({ trashRetentionDays: input.days })
		.where(eq(users.id, auth.user.id));

	return NextResponse.json({ days: input.days });
}
