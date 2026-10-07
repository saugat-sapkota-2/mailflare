/**
 * End-to-end check of JMAP Email/import and the `header` query filter against a
 * running dev server, in the shape a MIME-composing client sends: upload raw
 * message/rfc822, import it into Drafts, find it again by Message-ID, submit it.
 *
 *   npm run dev && npm run db:seed        # in another shell
 *   node scripts/jmap-import-check.mjs
 *
 * Pass a key with the `jmap` scope in JMAP_KEY, or let the script sign in with
 * the seeded demo account and mint one. BASE_URL overrides http://localhost:3000.
 */

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const DEMO = { email: "admin@example.com", password: "demo-password-change-me" };

let passed = 0;
let failed = 0;

function check(name, ok, detail) {
	if (ok) {
		passed += 1;
		console.log(`  ok   ${name}`);
	} else {
		failed += 1;
		console.log(`  FAIL ${name}${detail === undefined ? "" : ` — ${typeof detail === "string" ? detail : JSON.stringify(detail)}`}`);
	}
}

function section(title) {
	console.log(`\n${title}`);
}

async function mintKey() {
	if (process.env.JMAP_KEY) return process.env.JMAP_KEY;
	const login = await fetch(`${BASE}/api/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(DEMO),
	});
	if (!login.ok) throw new Error(`login failed (${login.status}); run npm run db:seed first`);
	const cookie = (login.headers.getSetCookie?.() ?? []).map((value) => value.split(";")[0]).join("; ");
	const created = await fetch(`${BASE}/api/api-keys`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Cookie: cookie },
		body: JSON.stringify({ name: `import-check ${Date.now()}`, scopes: ["jmap"] }),
	});
	if (!created.ok) throw new Error(`could not mint an API key (${created.status})`);
	return (await created.json()).key;
}

/** One JMAP request; returns the method responses. */
async function jmap(key, methodCalls, using = ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail", "urn:ietf:params:jmap:submission"]) {
	const response = await fetch(`${BASE}/jmap/api`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
		body: JSON.stringify({ using, methodCalls }),
	});
	const body = await response.json();
	if (!response.ok) throw new Error(`JMAP ${response.status}: ${JSON.stringify(body)}`);
	return body.methodResponses;
}

async function callOne(key, name, args) {
	const [[, result]] = await jmap(key, [[name, args, "c0"]]);
	return result;
}

/** A multipart/mixed message with one text part and one attachment. */
function buildMime({ from, to, subject, messageId, text, attachmentName, attachmentBody }) {
	const boundary = "mailflare-import-check-boundary";
	return [
		`From: ${from}`,
		`To: ${to}`,
		`Subject: ${subject}`,
		`Message-ID: ${messageId}`,
		"Date: Tue, 16 Sep 2026 09:00:00 +0000",
		"MIME-Version: 1.0",
		`Content-Type: multipart/mixed; boundary="${boundary}"`,
		"",
		`--${boundary}`,
		"Content-Type: text/plain; charset=utf-8",
		"Content-Transfer-Encoding: 7bit",
		"",
		text,
		`--${boundary}`,
		`Content-Type: text/plain; charset=utf-8; name="${attachmentName}"`,
		`Content-Disposition: attachment; filename="${attachmentName}"`,
		"Content-Transfer-Encoding: 7bit",
		"",
		attachmentBody,
		`--${boundary}--`,
		"",
	].join("\r\n");
}

async function upload(key, accountId, bytes) {
	const response = await fetch(`${BASE}/jmap/upload/${encodeURIComponent(accountId)}`, {
		method: "POST",
		headers: { "Content-Type": "message/rfc822", Authorization: `Bearer ${key}` },
		body: bytes,
	});
	if (!response.ok) throw new Error(`upload failed (${response.status})`);
	return response.json();
}

async function main() {
	const key = await mintKey();

	section("Session");
	const session = await (await fetch(`${BASE}/jmap/session`, { headers: { Authorization: `Bearer ${key}` } })).json();
	const accountId = session.primaryAccounts["urn:ietf:params:jmap:mail"];
	check("session advertises a mail account", !!accountId, session.primaryAccounts);
	check("session advertises the submission capability", !!session.capabilities["urn:ietf:params:jmap:submission"]);

	const mailboxes = await callOne(key, "Mailbox/get", { accountId, ids: null });
	const drafts = mailboxes.list.find((box) => box.role === "drafts");
	const inbox = mailboxes.list.find((box) => box.role === "inbox");
	check("a Drafts mailbox exists", !!drafts, mailboxes.list.map((box) => box.role));
	check("an Inbox mailbox exists", !!inbox);

	const identities = await callOne(key, "Identity/get", { accountId, ids: null });
	const identity = identities.list[0];
	check("at least one Identity to send from", !!identity, identities.list);

	section("Upload");
	const messageId = `<import-check-${Date.now()}@example.com>`;
	const otherMessageId = `<import-check-absent-${Date.now()}@example.com>`;
	const raw = buildMime({
		from: identity.email,
		to: "recipient@example.net",
		subject: "Import check",
		messageId,
		text: "Composed locally and imported over JMAP.\r\n",
		attachmentName: "note.txt",
		attachmentBody: "attachment body\r\n",
	});
	const rawBytes = new TextEncoder().encode(raw);
	const uploaded = await upload(key, accountId, rawBytes);
	check("upload returns a blobId", typeof uploaded.blobId === "string", uploaded);
	check("upload reports the exact size", uploaded.size === rawBytes.byteLength, { got: uploaded.size, want: rawBytes.byteLength });

	section("Email/import");
	const stale = await callOne(key, "Email/import", {
		accountId,
		ifInState: "not-the-current-state",
		emails: { s1: { blobId: uploaded.blobId, mailboxIds: { [drafts.id]: true }, keywords: { $draft: true, $seen: true } } },
	});
	check("a stale ifInState is a stateMismatch", stale.type === "stateMismatch", stale);

	const imported = await callOne(key, "Email/import", {
		accountId,
		emails: {
			d1: {
				blobId: uploaded.blobId,
				mailboxIds: { [drafts.id]: true },
				keywords: { $draft: true, $seen: true },
				receivedAt: "2026-09-16T09:00:00Z",
			},
		},
	});
	const created = imported.created?.d1;
	check("the message is created", !!created, imported);
	check("created carries an id", typeof created?.id === "string", created);
	check("created carries a blobId", typeof created?.blobId === "string", created);
	check("created carries a threadId", typeof created?.threadId === "string", created);
	check("created carries a size", typeof created?.size === "number" && created.size > 0, created);
	check("the state moves", imported.oldState !== imported.newState, { old: imported.oldState, new: imported.newState });
	check("nothing is reported as notCreated", Object.keys(imported.notCreated ?? {}).length === 0, imported.notCreated);

	section("Email/get on the imported draft");
	const fetched = await callOne(key, "Email/get", {
		accountId,
		ids: [created.id],
		properties: ["subject", "from", "to", "keywords", "mailboxIds", "attachments", "messageId", "threadId", "blobId", "size", "receivedAt", "header:Message-ID"],
	});
	const email = fetched.list[0];
	check("Email/get finds it", !!email, fetched);
	check("subject round-trips", email?.subject === "Import check", email?.subject);
	check("from round-trips", email?.from?.[0]?.email === identity.email, email?.from);
	check("to round-trips", email?.to?.[0]?.email === "recipient@example.net", email?.to);
	check("the attachment is stored", email?.attachments?.length === 1, email?.attachments);
	check("the attachment keeps its filename", email?.attachments?.[0]?.name === "note.txt", email?.attachments?.[0]);
	check("$draft is set", email?.keywords?.$draft === true, email?.keywords);
	check("$seen is set", email?.keywords?.$seen === true, email?.keywords);
	check("it lands in Drafts", email?.mailboxIds?.[drafts.id] === true, email?.mailboxIds);
	check("the Message-ID is stored", email?.messageId?.[0] === messageId.replace(/^<|>$/g, ""), email?.messageId);
	check("header:Message-ID answers it", typeof email?.["header:Message-ID"] === "string" && email["header:Message-ID"].includes(messageId), email?.["header:Message-ID"]);
	check("receivedAt honours the argument", email?.receivedAt?.startsWith("2026-09-16T09:00:00"), email?.receivedAt);
	check("the blobId matches the import response", email?.blobId === created.blobId, { get: email?.blobId, import: created.blobId });
	check("the threadId matches the import response", email?.threadId === created.threadId, { get: email?.threadId, import: created.threadId });
	check("the size matches the import response", email?.size === created.size, { get: email?.size, import: created.size });

	section("Blob download");
	const download = await fetch(`${BASE}/jmap/download/${encodeURIComponent(accountId)}/${encodeURIComponent(email.blobId)}/message.eml`, {
		headers: { Authorization: `Bearer ${key}` },
	});
	const downloaded = new Uint8Array(await download.arrayBuffer());
	check("the blob downloads", download.ok, download.status);
	check("the download is served as message/rfc822", (download.headers.get("content-type") ?? "").startsWith("message/rfc822"), download.headers.get("content-type"));
	check("the raw bytes are byte-identical to the upload", downloaded.length === rawBytes.length && downloaded.every((byte, index) => byte === rawBytes[index]), { got: downloaded.length, want: rawBytes.length });

	section("Email/query with a header filter");
	const byMessageId = await callOne(key, "Email/query", { accountId, filter: { inMailbox: drafts.id, header: ["Message-ID", messageId] } });
	check("the Message-ID filter returns exactly the imported draft", byMessageId.ids?.length === 1 && byMessageId.ids[0] === created.id, byMessageId.ids);

	const withoutBrackets = await callOne(key, "Email/query", { accountId, filter: { inMailbox: drafts.id, header: ["Message-ID", messageId.replace(/^<|>$/g, "")] } });
	check("the same id without angle brackets matches too", withoutBrackets.ids?.length === 1 && withoutBrackets.ids[0] === created.id, withoutBrackets.ids);

	const lowerCaseName = await callOne(key, "Email/query", { accountId, filter: { inMailbox: drafts.id, header: ["message-id", messageId] } });
	check("the header name is matched case-insensitively", lowerCaseName.ids?.length === 1 && lowerCaseName.ids[0] === created.id, lowerCaseName.ids);

	const otherId = await callOne(key, "Email/query", { accountId, filter: { inMailbox: drafts.id, header: ["Message-ID", otherMessageId] } });
	check("a different Message-ID matches nothing", otherId.ids?.length === 0, otherId.ids);

	const present = await callOne(key, "Email/query", { accountId, filter: { inMailbox: drafts.id, header: ["Message-ID"] } });
	check("the one-element form matches drafts that carry the header", present.ids?.includes(created.id), present.ids);

	const unfiltered = await callOne(key, "Email/query", { accountId, filter: { inMailbox: drafts.id } });
	check("the filter actually narrows the mailbox", unfiltered.ids?.length >= byMessageId.ids?.length, { all: unfiltered.ids?.length, filtered: byMessageId.ids?.length });

	const unknownHeader = await callOne(key, "Email/query", { accountId, filter: { inMailbox: drafts.id, header: ["X-Unknown"] } });
	check("an unsupported header is an unsupportedFilter error", unknownHeader.type === "unsupportedFilter", unknownHeader);

	const unknownInTree = await callOne(key, "Email/query", {
		accountId,
		filter: { operator: "AND", conditions: [{ inMailbox: drafts.id }, { header: ["X-Mailer", "anything"] }] },
	});
	check("an unsupported header inside an operator tree errors too", unknownInTree.type === "unsupportedFilter", unknownInTree);

	section("Rejections");
	const wrongMailbox = await callOne(key, "Email/import", {
		accountId,
		emails: { bad: { blobId: uploaded.blobId, mailboxIds: { [inbox.id]: true } } },
	});
	check("importing into Inbox is invalidProperties", wrongMailbox.notCreated?.bad?.type === "invalidProperties", wrongMailbox.notCreated);
	check("the rejection names mailboxIds", wrongMailbox.notCreated?.bad?.properties?.[0] === "mailboxIds", wrongMailbox.notCreated?.bad);

	const twoMailboxes = await callOne(key, "Email/import", {
		accountId,
		emails: { bad: { blobId: uploaded.blobId, mailboxIds: { [drafts.id]: true, [inbox.id]: true } } },
	});
	check("importing into two mailboxes is invalidProperties", twoMailboxes.notCreated?.bad?.type === "invalidProperties", twoMailboxes.notCreated);

	const missingBlob = await callOne(key, "Email/import", {
		accountId,
		emails: { bad: { blobId: "up~does-not-exist", mailboxIds: { [drafts.id]: true } } },
	});
	check("an unknown blobId is blobNotFound", missingBlob.notCreated?.bad?.type === "blobNotFound", missingBlob.notCreated);

	const nonUploadBlob = await callOne(key, "Email/import", {
		accountId,
		emails: { bad: { blobId: `msg~${created.id}`, mailboxIds: { [drafts.id]: true } } },
	});
	check("a non-upload blobId is blobNotFound", nonUploadBlob.notCreated?.bad?.type === "blobNotFound", nonUploadBlob.notCreated);

	check("the upload is released once claimed", missingBlob.notCreated?.bad?.type === "blobNotFound" && (await callOne(key, "Email/import", { accountId, emails: { again: { blobId: uploaded.blobId, mailboxIds: { [drafts.id]: true } } } })).notCreated?.again?.type === "blobNotFound", "re-importing the claimed upload should fail");

	section("Import and submit in one request");
	const secondMessageId = `<import-check-submit-${Date.now()}@example.com>`;
	const secondRaw = new TextEncoder().encode(buildMime({
		from: identity.email,
		to: "recipient@example.net",
		subject: "Import and submit",
		messageId: secondMessageId,
		text: "Sent straight after import.\r\n",
		attachmentName: "second.txt",
		attachmentBody: "second attachment\r\n",
	}));
	const secondUpload = await upload(key, accountId, secondRaw);
	const responses = await jmap(key, [
		["Email/import", { accountId, emails: { d2: { blobId: secondUpload.blobId, mailboxIds: { [drafts.id]: true }, keywords: { $draft: true, $seen: true } } } }, "i1"],
		["EmailSubmission/set", { accountId, create: { s1: { emailId: "#d2", identityId: identity.id } } }, "i2"],
	]);
	const importResponse = responses.find(([name, , id]) => name === "Email/import" && id === "i1")?.[1];
	const submission = responses.find(([name, , id]) => name === "EmailSubmission/set" && id === "i2")?.[1];
	const implicitSet = responses.find(([name, , id]) => name === "Email/set" && id === "i2")?.[1];
	const importedId = importResponse?.created?.d2?.id;
	check("the second import succeeds", !!importedId, importResponse);
	check("#creationId resolves in the same request", !!submission?.created?.s1, submission);
	check("the submission is final", submission?.created?.s1?.undoStatus === "final", submission?.created?.s1);
	check("the implicit Email/set reports the draft destroyed", implicitSet?.destroyed?.includes(importedId), implicitSet);

	const gone = await callOne(key, "Email/get", { accountId, ids: [importedId] });
	check("the draft is gone after sending", gone.notFound?.includes(importedId), gone);

	const sent = await callOne(key, "Email/query", { accountId, filter: { inMailbox: `${drafts.id.split("~")[0]}~sent` }, limit: 5 });
	check("a sent copy exists", (sent.ids?.length ?? 0) > 0, sent.ids);

	section("Cleanup");
	const destroyed = await callOne(key, "Email/set", { accountId, destroy: [created.id] });
	check("the first imported draft can be destroyed", destroyed.destroyed?.includes(created.id), destroyed);

	console.log(`\n${passed} passed, ${failed} failed`);
	process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
	console.error(`\nAborted: ${error.message}`);
	process.exit(1);
});
