import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getEnv(): CloudflareEnv {
	return getCloudflareContext().env as CloudflareEnv;
}

export async function getEnvAsync(): Promise<CloudflareEnv> {
	return (await getCloudflareContext({ async: true })).env as CloudflareEnv;
}
