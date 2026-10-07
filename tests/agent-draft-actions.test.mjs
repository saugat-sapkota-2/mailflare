import assert from "node:assert/strict";
import test from "node:test";
import { uniqueAgentDraftActions } from "../src/components/agent/utils.ts";

function tool(id, content, toolState = "used") {
	return { id, role: "tool", content: JSON.stringify(content), toolState };
}

test("draft then edit then review keeps one action on the latest revision", () => {
	const actions = uniqueAgentDraftActions([
		tool("draft", { draftId: "d1", revision: 1, status: "draft_created" }),
		tool("edit", { draftId: "d1", revision: 2, status: "draft_updated", scheduledAt: "2026-10-01T15:00:00.000Z" }),
		tool("review", { draftId: "d1", revision: 2, status: "pending_approval", scheduledAt: "2026-10-01T15:00:00.000Z", reviewUrl: "/agent/review/a1" }),
	]);
	assert.deepEqual(actions, [{ messageId: "review", draftId: "d1", revision: 2, scheduledAt: "2026-10-01T15:00:00.000Z" }]);
});

test("a cleared schedule does not keep the previous send time", () => {
	const actions = uniqueAgentDraftActions([
		tool("edit", { draftId: "d1", revision: 2, status: "draft_updated", scheduledAt: "2026-10-01T15:00:00.000Z" }),
		tool("clear", { draftId: "d1", revision: 3, status: "draft_updated", scheduledAt: null }),
	]);
	assert.equal(actions[0].scheduledAt, null);
	assert.equal(actions[0].revision, 3);
});

test("separate drafts each keep one action, and a sent draft drops its action", () => {
	const actions = uniqueAgentDraftActions([
		tool("a", { draftId: "d1", revision: 1, status: "draft_created" }),
		tool("b", { draftId: "d2", revision: 1, status: "draft_created" }),
		tool("sent", { draftId: "d1", revision: 1, status: "sent" }),
	]);
	assert.deepEqual(actions.map((action) => action.draftId), ["d2"]);
});
