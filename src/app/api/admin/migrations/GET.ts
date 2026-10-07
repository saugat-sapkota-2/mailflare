import { NextResponse } from "next/server";
import { getMigrationStatus } from "@/lib/migrations/service";
import { authorizeMigrationRequest } from "./utils";

export async function GET(request: Request) {
	const authorization = await authorizeMigrationRequest(request);
	if ("error" in authorization) return authorization.error;

	try {
		return NextResponse.json(await getMigrationStatus(authorization.env.DB));
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Could not check database migrations" },
			{ status: 500 },
		);
	}
}
