import Link from "next/link";
import type { AgentEmailLinkProps } from "./types";
import { agentDraftIdForEmail, agentEmailHref } from "./utils";

export function AgentEmailLink({ email, className }: AgentEmailLinkProps) {
	const draftId = agentDraftIdForEmail(email);
	if (draftId) return <Link className={className} href={`/drafts/${encodeURIComponent(draftId)}`}>{email.subject || "(No subject)"}</Link>;
	return <Link className={className} href={agentEmailHref(email)}>{email.subject || "(No subject)"}</Link>;
}
