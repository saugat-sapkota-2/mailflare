/** RFC 5322 Message-IDs are compared without their angle brackets or surrounding space. */
export function normalizeMessageId(value: string | null | undefined): string | null {
	const trimmed = (value ?? "").trim().replace(/^<|>$/g, "").trim();
	return trimmed || null;
}

/** Keep the parent, thread root, and newest ancestors within D1's 100 parameter limit. */
export function selectThreadLookupIds(inReplyTo: string | null | undefined, references: string[]): string[] {
	const MAX_THREAD_LOOKUP_IDS = 40; // One mailbox parameter plus two variants per ID: at most 81.
	const candidates = new Set<string>();
	const add = (value: string | null | undefined) => {
		const id = normalizeMessageId(value);
		if (id) candidates.add(id);
	};

	add(inReplyTo);
	add(references[0]);
	for (let index = references.length - 1; index >= 1 && candidates.size < MAX_THREAD_LOOKUP_IDS; index--) {
		add(references[index]);
	}
	return Array.from(candidates);
}
