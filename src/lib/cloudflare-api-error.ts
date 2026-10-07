import type { CfApiError } from "@/lib/cloudflare-api.types";

export class CloudflareApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly path: string,
		readonly errors: CfApiError[],
	) {
		super(message);
		this.name = "CloudflareApiError";
	}
}

export function isCloudflareApiErrorCode(error: unknown, code: number): boolean {
	return error instanceof CloudflareApiError && error.errors.some((item) => item.code === code);
}
