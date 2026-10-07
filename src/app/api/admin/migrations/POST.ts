import { NextResponse } from "next/server";
import { applyPendingMigrations } from "@/lib/migrations/service";
import { authorizeMigrationRequest } from "./utils";

export async function POST(request: Request) {
	const authorization = await authorizeMigrationRequest(request);
	if ("error" in authorization) return authorization.error;

	try {
		return NextResponse.json(await applyPendingMigrations(authorization.env.DB));
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Could not apply database migrations" },
			{ status: 500 },
		);
	}
}
