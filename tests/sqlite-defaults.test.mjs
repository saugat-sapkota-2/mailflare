import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = mkdtempSync(join(root, "tests", ".tmp-sqlite-defaults-"));
after(() => rmSync(outDir, { recursive: true, force: true }));

await build({
	entryPoints: [join(root, "server/runtime/sqlite-database.ts")],
	outfile: join(outDir, "entry.mjs"),
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node22",
	external: ["better-sqlite3"],
	logLevel: "silent",
});

const { SqliteDatabase } = await import(pathToFileURL(join(outDir, "entry.mjs")).href);

test("node sqlite keeps stock durability and cache defaults", () => {
	const database = new SqliteDatabase(join(outDir, "mail.sqlite"));
	try {
		assert.equal(database.db.pragma("journal_mode", { simple: true }), "wal");
		assert.equal(database.db.pragma("foreign_keys", { simple: true }), 1);
		assert.equal(database.db.pragma("synchronous", { simple: true }), 2);
		assert.equal(database.db.pragma("mmap_size", { simple: true }), 0);
		assert.notEqual(database.db.pragma("cache_size", { simple: true }), -65536);
	} finally {
		database.db.close();
	}
});

test("upstream sqlite setup does not mention a private mailbox size or host cache knobs", () => {
	const source = readFileSync(join(root, "server/runtime/sqlite-database.ts"), "utf8");
	assert.equal(source.includes("13GB"), false);
	assert.equal(source.includes("mmap_size"), false);
	assert.equal(source.includes("cache_size"), false);
	assert.equal(source.includes("synchronous = NORMAL"), false);
	const route = readFileSync(join(root, "src/app/api/messages/route.ts"), "utf8");
	assert.equal(route.includes("13GB"), false);
	assert.equal(route.includes("maxScan"), false);
});

test("cached reads switch between raw arrays and named row objects", async () => {
	const database = new SqliteDatabase(":memory:");
	try {
		const query = "SELECT ? AS value";
		assert.deepEqual(await database.prepare(query).bind("raw").raw(), [["raw"]]);
		assert.deepEqual(await database.prepare(query).bind("first").first(), { value: "first" });
		assert.deepEqual(await database.prepare(query).bind("raw-again").raw(), [["raw-again"]]);
		assert.equal(await database.prepare(query).bind("column").first("value"), "column");
		assert.deepEqual(await database.prepare(query).bind("raw-before-all").raw(), [["raw-before-all"]]);
		assert.deepEqual((await database.prepare(query).bind("all").all()).results, [{ value: "all" }]);
		assert.deepEqual(await database.prepare(query).bind("last-raw").raw(), [["last-raw"]]);
	} finally {
		database.db.close();
	}
});
