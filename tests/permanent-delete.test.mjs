import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const directory = mkdtempSync(join(root, "node_modules", "mailflare-permanent-delete-test-"));
after(() => rmSync(directory, { recursive: true, force: true }));
await build({
	stdin: {
		contents: `
			export { isAllowedBulkMessageAction, getStatusForBulkAction, getReadValueForBulkAction, isPermanentlyDeletableStatus, isPermanentDeleteFolder } from "./src/app/api/messages/bulk/utils.ts";
			export { supportsPermanentDelete, getEmptyFolderLabel, getPermanentDeleteConfirmText, getEmptyFolderConfirmText } from "./src/lib/messages/permanent-delete-utils.ts";
			export { TRASH_RETENTION_OPTIONS, getTrashRetentionCutoff, normalizeTrashRetentionDays, describeTrashRetention } from "./src/lib/email/trash-retention-utils.ts";
			export { updateTrashRetentionSettingsSchema } from "./src/lib/validators.ts";
		`,
		resolveDir: root,
		sourcefile: "permanent-delete-test-entry.ts",
	},
	outfile: join(directory, "entry.mjs"),
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node24",
	tsconfig: join(root, "tsconfig.json"),
	packages: "external",
	logLevel: "silent",
});
const m = await import(pathToFileURL(join(directory, "entry.mjs")).href);

test("delete is an accepted bulk action that changes neither status nor read state", () => {
	assert.equal(m.isAllowedBulkMessageAction("delete"), true);
	assert.equal(m.getStatusForBulkAction("delete"), null);
	assert.equal(m.getReadValueForBulkAction("delete"), null);
	assert.equal(m.isAllowedBulkMessageAction("destroy"), false);
});

test("only Trash and Spam messages can be permanently deleted", () => {
	for (const status of ["trash", "spam"]) assert.equal(m.isPermanentlyDeletableStatus(status), true);
	for (const status of ["received", "sent", "draft", "archived", "", null, undefined]) {
		assert.equal(m.isPermanentlyDeletableStatus(status), false, String(status));
	}
	assert.equal(m.isPermanentDeleteFolder("trash"), true);
	assert.equal(m.isPermanentDeleteFolder("inbox"), false);
});

test("the UI offers permanent delete only in Trash and Spam", () => {
	assert.equal(m.supportsPermanentDelete("trash"), true);
	assert.equal(m.supportsPermanentDelete("spam"), true);
	assert.equal(m.supportsPermanentDelete("inbox"), false);
	assert.equal(m.supportsPermanentDelete(undefined), false);
	assert.equal(m.getEmptyFolderLabel("trash"), "Empty Trash");
	assert.equal(m.getEmptyFolderLabel("spam"), "Empty Spam");
});

test("confirmation text says how much is lost and that it is irreversible", () => {
	assert.equal(m.getPermanentDeleteConfirmText(1), "Permanently delete this message? This cannot be undone.");
	assert.equal(m.getPermanentDeleteConfirmText(3), "Permanently delete these 3 messages? This cannot be undone.");
	assert.equal(m.getEmptyFolderConfirmText("trash", 12), "Permanently delete all 12 messages in Trash? This cannot be undone.");
	assert.equal(m.getEmptyFolderConfirmText("spam", 1), "Permanently delete the 1 message in Spam? This cannot be undone.");
	assert.equal(m.getEmptyFolderConfirmText("trash"), "Permanently delete every message in Trash? This cannot be undone.");
});

test("retention cutoff is the given number of days before now", () => {
	const now = new Date("2026-10-31T12:00:00Z");
	assert.equal(m.getTrashRetentionCutoff(now, 30).toISOString(), "2026-10-01T12:00:00.000Z");
	assert.equal(m.getTrashRetentionCutoff(now, 1).toISOString(), "2026-10-30T12:00:00.000Z");
});

test("retention days outside 1-365 or non-integers mean never", () => {
	for (const days of m.TRASH_RETENTION_OPTIONS) assert.equal(m.normalizeTrashRetentionDays(days), days);
	for (const days of [null, undefined, 0, -3, 366, 2.5, "30"]) assert.equal(m.normalizeTrashRetentionDays(days), null, String(days));
	assert.equal(m.describeTrashRetention(null), "Never");
	assert.equal(m.describeTrashRetention(1), "After 1 day");
	assert.equal(m.describeTrashRetention(30), "After 30 days");
});

test("the settings API accepts whole days from 1 to 365, or null to turn it off", () => {
	const ok = (days) => m.updateTrashRetentionSettingsSchema.safeParse({ days }).success;
	assert.equal(ok(30), true);
	assert.equal(ok(null), true);
	assert.equal(ok(0), false);
	assert.equal(ok(400), false);
	assert.equal(ok(1.5), false);
	assert.equal(ok("30"), false);
});
