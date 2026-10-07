import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = mkdtempSync(join(tmpdir(), "mailflare-imap-batch-test-"));
after(() => rmSync(outDir, { recursive: true, force: true }));

await build({
	stdin: {
		contents: `export { selectImapUidBatch } from "./src/lib/import/imap-utils.ts";`,
		resolveDir: root,
		sourcefile: "imap-batch-test-entry.js",
	},
	outfile: join(outDir, "entry.mjs"),
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node22",
	tsconfig: join(root, "tsconfig.json"),
	logLevel: "silent",
});

const { selectImapUidBatch } = await import(pathToFileURL(join(outDir, "entry.mjs")).href);
const uids = Array.from({ length: 250 }, (_, index) => String(index + 1));

test("first batch is the newest messages", () => {
	const batch = selectImapUidBatch(uids, 100, 0);
	assert.equal(batch.uids.length, 100);
	assert.equal(batch.uids[0], "151");
	assert.equal(batch.uids.at(-1), "250");
	assert.equal(batch.total, 250);
	assert.equal(batch.nextOffset, 100);
});

test("walking nextOffset covers every message exactly once", () => {
	const seen = [];
	let offset = 0;
	let guard = 0;
	while (offset !== null && guard++ < 10) {
		const batch = selectImapUidBatch(uids, 100, offset);
		seen.push(...batch.uids);
		offset = batch.nextOffset;
	}
	assert.equal(seen.length, 250);
	assert.equal(new Set(seen).size, 250);
});

test("last partial batch ends the walk", () => {
	const batch = selectImapUidBatch(uids, 100, 200);
	assert.deepEqual(batch.uids, uids.slice(0, 50));
	assert.equal(batch.nextOffset, null);
});

test("a folder smaller than the limit finishes in one batch", () => {
	const batch = selectImapUidBatch(["1", "2", "3"], 100, 0);
	assert.deepEqual(batch.uids, ["1", "2", "3"]);
	assert.equal(batch.nextOffset, null);
});

test("empty folder and out-of-range offset are safe", () => {
	assert.deepEqual(selectImapUidBatch([], 100, 0), { uids: [], total: 0, nextOffset: null });
	const past = selectImapUidBatch(uids, 100, 9999);
	assert.deepEqual(past.uids, []);
	assert.equal(past.nextOffset, null);
});

test("invalid limit or offset fall back to safe values", () => {
	assert.equal(selectImapUidBatch(uids, 0, 0).uids.length, 1);
	assert.equal(selectImapUidBatch(uids, 100, -5).uids.length, 100);
	assert.equal(selectImapUidBatch(uids, 100, Number.NaN).uids.length, 100);
});
