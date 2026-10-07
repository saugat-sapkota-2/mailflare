import { env } from "cloudflare:workers";
import { getNodeEnv } from "@/lib/runtime";

export function getEnv(): CloudflareEnv {
	return getNodeEnv() ?? (env as CloudflareEnv);
}

export async function getEnvAsync(): Promise<CloudflareEnv> {
	return getEnv();
}
