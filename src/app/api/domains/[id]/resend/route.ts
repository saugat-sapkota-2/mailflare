import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireUser } from "@/lib/auth/cookies";
import { canManageDomains } from "@/lib/auth/admin";
import { hasValidSessionMutationOrigin } from "@/lib/auth/origin";
import { getDomainForUser } from "@/lib/domains/service";
import { ResendRestrictedKeyError } from "@/lib/email/resend-api";
import { getResendKeyStatus } from "@/lib/email/outbound-provider";
import { sendSystemEmail } from "@/lib/email/system-mail";
import { getResendDomainView, setupResendDomain, verifyResendDomainView } from "@/lib/domains/resend-domain";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	const domain = await getDomainForUser(env, user.id, id);
	if (!domain) return NextResponse.json({ error: "Not found" }, { status: 404 });
	if (domain.sendingProvider !== "resend") return NextResponse.json({ error: "Resend is not selected for this domain" }, { status: 400 });
	const key = await getResendKeyStatus(env);
	if (!key.configured) return NextResponse.json({ keyConfigured: false, resend: null }, { headers: { "Cache-Control": "no-store" } });
	try {
		return NextResponse.json({ keyConfigured: true, resend: await getResendDomainView(env, domain) }, { headers: { "Cache-Control": "no-store" } });
	} catch (error) {
		// A send-only key is valid; it just cannot look at domains.
		if (error instanceof ResendRestrictedKeyError) return NextResponse.json({ keyConfigured: true, canManageDomains: false, resend: null }, { headers: { "Cache-Control": "no-store" } });
		return NextResponse.json({ error: error instanceof Error ? error.message : "Could not reach Resend" }, { status: 502 });
	}
}

export async function POST(request: Request, { params }: Params) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	if (!canManageDomains(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	if (!hasValidSessionMutationOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
	const domain = await getDomainForUser(env, user.id, id);
	if (!domain) return NextResponse.json({ error: "Not found" }, { status: 404 });
	const body = (await request.json().catch(() => ({}))) as { action?: string };
	if (body.action !== "setup" && body.action !== "verify" && body.action !== "test") return NextResponse.json({ error: "Unknown action" }, { status: 400 });
	try {
		if (body.action === "test") {
			const sent = await sendSystemEmail(env, {
				to: user.email,
				subject: "Mailflare test email",
				text: `This message confirms ${domain.hostname} can send mail through Resend.`,
				hostname: domain.hostname,
			});
			if (!sent) return NextResponse.json({ error: `Create a mailbox on ${domain.hostname} to send the test from.` }, { status: 400 });
			return NextResponse.json({ ok: true, to: user.email });
		}
		const resend = body.action === "setup" ? await setupResendDomain(env, domain) : await verifyResendDomainView(env, domain);
		return NextResponse.json({ resend }, { headers: { "Cache-Control": "no-store" } });
	} catch (error) {
		return NextResponse.json({ error: error instanceof Error ? error.message : "Resend request failed" }, { status: 502 });
	}
}
