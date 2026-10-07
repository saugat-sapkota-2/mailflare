import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { authenticateAdminApiKey } from "@/lib/api/admin-auth";
import { getDomainForUser, removeDomainForUser } from "@/lib/domains/service";

type Params = { params: Promise<{ id: string }> };

async function authorize(request: Request) {
	const env = getEnv();
	const auth = await authenticateAdminApiKey(env, request, "domains");
	if (!auth) return null;
	return auth;
}

export async function GET(request: Request, { params }: Params) {
	const auth = await authorize(request);
	if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const domain = await getDomainForUser(getEnv(), auth.userId, id);
	if (!domain) return NextResponse.json({ error: "Not found" }, { status: 404 });
	return NextResponse.json({ domain });
}

export async function DELETE(request: Request, { params }: Params) {
	const auth = await authorize(request);
	if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	try {
		await removeDomainForUser(getEnv(), auth.userId, id);
		return NextResponse.json({ ok: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Failed to remove domain";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
