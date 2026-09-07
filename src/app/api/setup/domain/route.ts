import { NextResponse } from "next/server";
import { hasAdminAccount } from "@/lib/auth/setup";
import { getEnv } from "@/lib/cloudflare";
import { provisionDomainOnCloudflare } from "@/lib/domains/provision";
import { getPrimaryDomain } from "@/lib/user";
import { setupDomainSchema } from "@/lib/validators";
import { readJsonBody } from "@/lib/http/request";
import { RequestBodyTooLargeError } from "@/lib/http/errors";

export async function POST(request: Request) {
	const env = getEnv();
	if (await hasAdminAccount(env)) {
		return NextResponse.json({ error: "Initial setup is already complete" }, { status: 403 });
	}

	const existing = await getPrimaryDomain(env);
	if (existing) {
		return NextResponse.json({ error: "Primary domain already exists" }, { status: 409 });
	}

	let body: unknown;
	try {
		body = await readJsonBody(request, 16 * 1024);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: "Invalid setup request" }, { status });
	}
	const parsed = setupDomainSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}

	try {
		const provisioned = await provisionDomainOnCloudflare(env, parsed.data.hostname, {
			enableRouting: true,
			enableSending: true,
		});
		return NextResponse.json({
			domain: {
				hostname: provisioned.hostname,
				zoneId: provisioned.zone.id,
				routingEnabled: provisioned.routingEnabled,
				sendingEnabled: provisioned.sendingEnabled,
			},
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Domain setup failed";
		return NextResponse.json({ error: message }, { status: 502 });
	}
}
