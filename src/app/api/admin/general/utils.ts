import { z } from "zod";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { getEnv } from "@/lib/cloudflare";
import { requireSessionUser } from "@/lib/api/auth";
import { isPrimaryAdmin } from "@/lib/auth/admin";
import { hasValidSessionMutationOrigin } from "@/lib/auth/origin";
import { getOutboundAttachmentMaxMb, MAX_OUTBOUND_ATTACHMENT_MAX_MB } from "@/lib/email/attachment-policy";

const schema = z.object({ outboundAttachmentMaxMb: z.number().int().min(1).max(MAX_OUTBOUND_ATTACHMENT_MAX_MB) });

export async function GET(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	if (!isPrimaryAdmin(auth.user)) return Response.json({ error: "Forbidden" }, { status: 403 });
	return Response.json({ outboundAttachmentMaxMb: await getOutboundAttachmentMaxMb(env) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	if (!isPrimaryAdmin(auth.user)) return Response.json({ error: "Forbidden" }, { status: 403 });
	if (!hasValidSessionMutationOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
	const parsed = schema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) return Response.json({ error: "Choose a whole number from 1 to 25 MB" }, { status: 400 });
	const values = { outboundAttachmentMaxMb: parsed.data.outboundAttachmentMaxMb, updatedAt: new Date() };
	await getDb(env).insert(appSettings).values({ id: "default", ...values }).onConflictDoUpdate({ target: appSettings.id, set: values });
	return Response.json(values, { headers: { "Cache-Control": "no-store" } });
}
