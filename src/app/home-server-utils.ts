import { cache } from "react";
import { getBranding } from "@/lib/branding/service";
import { getEnv } from "@/lib/cloudflare";
import { DEFAULT_BRANDING } from "@/components/branding-provider-utils";

export const getHomeBranding = cache(async () => {
	try {
		return await getBranding(getEnv());
	} catch {
		return DEFAULT_BRANDING;
	}
});
