export type ApiKey = {
	id: string;
	name: string;
	prefix: string;
	kind: "legacy" | "mcp";
	scopes: string;
	createdAt?: string;
	lastUsedAt?: string | null;
};
