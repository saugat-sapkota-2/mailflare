import type { SessionUser } from "@/lib/auth/types";

export type McpPrincipal = {
	keyId: string;
	user: SessionUser;
	scopes: string[];
	mailboxIds: string[];
};
