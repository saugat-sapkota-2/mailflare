import { authFetch } from "@/lib/auth/client";
import type { ReviewSnapshot } from "./send-review-types";

export async function requestDraftReview(draftId: string, expectedRevision: number): Promise<{ approvalId: string; snapshot: ReviewSnapshot }> {
	const response = await authFetch("/api/agent/approvals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId, expectedRevision }) });
	const result = await response.json() as { approvalId?: string; snapshot?: ReviewSnapshot; error?: string };
	if (!response.ok || !result.approvalId || !result.snapshot) throw new Error(result.error || "Could not open draft review");
	return { approvalId: result.approvalId, snapshot: result.snapshot };
}

export async function approveAgentAction(toolMessageId: string): Promise<Record<string, unknown>> {
	const response = await authFetch("/api/agent/actions/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolMessageId }) });
	const result = await response.json() as Record<string, unknown>;
	if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Could not approve action");
	return result;
}
