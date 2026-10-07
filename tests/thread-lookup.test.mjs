import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = mkdtempSync(join(tmpdir(), "mailflare-thread-lookup-test-"));
after(() => rmSync(outDir, { recursive: true, force: true }));

await build({
	entryPoints: [join(root, "src/lib/email/thread-lookup.ts")],
	outfile: join(outDir, "entry.mjs"),
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node22",
	logLevel: "silent",
});

const { selectThreadLookupIds } = await import(pathToFileURL(join(outDir, "entry.mjs")).href);

test("144 References stay within D1's bound parameter limit while preserving parent, root, and recent ancestors", () => {
	const references = Array.from({ length: 144 }, (_, index) => `ref-${index}@example.com`);
	const selected = selectThreadLookupIds("<parent@example.com>", references);

	assert.equal(selected.length, 40);
	assert.equal(1 + selected.length * 2, 81);
	assert.equal(selected[0], "parent@example.com");
	assert.equal(selected[1], references[0]);
	assert.deepEqual(selected.slice(2), references.slice(-38).reverse());
});

test("an In-Reply-To also present in References is only looked up once", () => {
	const references = Array.from({ length: 144 }, (_, index) => `ref-${index}@example.com`);
	const selected = selectThreadLookupIds(`<${references.at(-1)}>`, references);

	assert.equal(selected.length, 40);
	assert.equal(new Set(selected).size, selected.length);
	assert.equal(selected[0], references.at(-1));
	assert.equal(selected[1], references[0]);
});
