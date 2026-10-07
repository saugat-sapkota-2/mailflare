import { getEnv } from "@/lib/cloudflare";
import { requireSessionUser } from "@/lib/api/auth";
import { CLOUD_ATTACHMENT_THRESHOLD_BYTES, getOutboundAttachmentMaxMb } from "@/lib/email/attachment-policy";

export async function GET(request: Request) {
	const env = getEnv();
	const auth = await requireSessionUser(env, request);
	if (auth.error) return auth.error;
	return Response.json({ maxMb: await getOutboundAttachmentMaxMb(env), cloudThresholdBytes: CLOUD_ATTACHMENT_THRESHOLD_BYTES }, { headers: { "Cache-Control": "no-store" } });
}
