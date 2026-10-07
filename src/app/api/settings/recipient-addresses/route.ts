import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireSessionUser } from "@/lib/api/auth";
import { getEnv } from "@/lib/cloudflare";
import type { UpdateRecipientAddressSettingsInput } from "./types";
import { parseUpdateRecipientAddressSettingsRequest } from "./utils";

export async function GET(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	return NextResponse.json({ enabled: auth.user.showFullRecipientAddresses });
}

export async function PATCH(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;

	let input: UpdateRecipientAddressSettingsInput;
	try {
		input = await parseUpdateRecipientAddressSettingsRequest(request);
	} catch (error) {
		return NextResponse.json({ error: error instanceof ZodError ? error.flatten() : "Invalid request" }, { status: 400 });
	}

	await getDb(env)
		.update(users)
		.set({ showFullRecipientAddresses: input.enabled })
		.where(eq(users.id, auth.user.id));

	return NextResponse.json({ enabled: input.enabled });
}
