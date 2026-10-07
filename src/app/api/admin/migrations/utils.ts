import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/app/api/admin/update/utils";

export async function authorizeMigrationRequest(request: Request) {
	const authorization = await authorizeAdminRequest(request);
	if ("error" in authorization) return authorization;
	if (request.method !== "GET" && request.headers.get("Origin") !== new URL(request.url).origin) {
		return { error: NextResponse.json({ error: "Invalid request origin" }, { status: 403 }) };
	}
	return authorization;
}
