import type { JmapContext } from "./types";
import { getJmapRevision } from "./revision";

/** Opaque revision tokens change on every message or folder write. */
export async function getEmailState(ctx: JmapContext): Promise<string> {
	return getJmapRevision(ctx);
}

export async function getMailboxState(ctx: JmapContext, emailState?: string): Promise<string> {
	return emailState ?? getJmapRevision(ctx);
}
