import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";

export const DEFAULT_OUTBOUND_ATTACHMENT_MAX_MB = 25;
export const MAX_OUTBOUND_ATTACHMENT_MAX_MB = 25;
export const CLOUD_ATTACHMENT_THRESHOLD_BYTES = 3_000_000;

export async function getOutboundAttachmentMaxMb(env: CloudflareEnv): Promise<number> {
	const [settings] = await getDb(env)
		.select({ maxMb: appSettings.outboundAttachmentMaxMb })
		.from(appSettings)
		.where(eq(appSettings.id, "default"))
		.limit(1);
	return settings?.maxMb ?? DEFAULT_OUTBOUND_ATTACHMENT_MAX_MB;
}
