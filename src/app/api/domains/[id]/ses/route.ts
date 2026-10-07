import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireUser } from "@/lib/auth/cookies";
import { canManageDomains } from "@/lib/auth/admin";
import { hasValidSessionMutationOrigin } from "@/lib/auth/origin";
import { getAwsConfig } from "@/lib/aws/config";
import { getSesSendingView, setupSesSending } from "@/lib/aws/ses-sending";
import { AwsError } from "@/lib/aws/client";
import { getDomainForUser } from "@/lib/domains/service";
import { sendSystemEmail } from "@/lib/email/system-mail";

type Params = { params: Promise<{ id: string }> };
const noStore = { "Cache-Control": "no-store" };

/** SES sending status for a domain: identity, DKIM, DNS and sandbox state. */
export async function GET(request: Request, { params }: Params) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	const domain = await getDomainForUser(env, user.id, id);
	if (!domain) return NextResponse.json({ error: "Not found" }, { status: 404 });
	if (!(await getAwsConfig(env))) return NextResponse.json({ credentials: false, ses: null }, { headers: noStore });
	try {
		return NextResponse.json({ credentials: true, ses: await getSesSendingView(env, domain) }, { headers: noStore });
	} catch (error) {
		if (error instanceof AwsError && error.accessDenied) return NextResponse.json({ credentials: true, ses: null, error: "These AWS credentials cannot manage SES identities. Re-check them under AWS credentials." }, { headers: noStore });
		return NextResponse.json({ error: error instanceof Error ? error.message : "Could not reach AWS" }, { status: 502 });
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
	try {
		if (body.action === "test") {
			const sent = await sendSystemEmail(env, { to: user.email, subject: "Mailflare test email", text: `This message confirms ${domain.hostname} can send mail through Amazon SES.`, hostname: domain.hostname });
			if (!sent) return NextResponse.json({ error: `Create a mailbox on ${domain.hostname} to send the test from.` }, { status: 400 });
			return NextResponse.json({ ok: true, to: user.email });
		}
		if (body.action === "setup") return NextResponse.json({ ses: await setupSesSending(env, domain) }, { headers: noStore });
		if (body.action === "verify") return NextResponse.json({ ses: await getSesSendingView(env, domain) }, { headers: noStore });
		return NextResponse.json({ error: "Unknown action" }, { status: 400 });
	} catch (error) {
		return NextResponse.json({ error: error instanceof Error ? error.message : "AWS request failed" }, { status: 502 });
	}
}
