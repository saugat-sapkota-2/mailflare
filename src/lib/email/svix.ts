/**
 * Verifies a Svix-signed webhook (what Resend sends): HMAC-SHA256 over
 * `${id}.${timestamp}.${body}` with the base64 secret after the `whsec_` prefix,
 * compared against every `v1,<base64>` entry in the signature header.
 */
export async function verifySvixSignature(
	secret: string,
	headers: { id: string | null; timestamp: string | null; signature: string | null },
	body: string,
	toleranceSeconds = 5 * 60,
	now = Date.now(),
): Promise<boolean> {
	const { id, timestamp, signature } = headers;
	if (!id || !timestamp || !signature) return false;
	const seconds = Number(timestamp);
	if (!Number.isFinite(seconds) || Math.abs(now / 1000 - seconds) > toleranceSeconds) return false;

	const raw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
	let keyBytes: Uint8Array;
	try { keyBytes = Uint8Array.from(atob(raw), (char) => char.charCodeAt(0)); } catch { return false; }
	const key = await crypto.subtle.importKey("raw", keyBytes as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)));
	const expectedB64 = btoa(String.fromCharCode(...expected));

	return signature.split(" ").some((entry) => {
		const [version, value] = entry.split(",");
		if (version !== "v1" || !value || value.length !== expectedB64.length) return false;
		let diff = 0;
		for (let index = 0; index < value.length; index += 1) diff |= value.charCodeAt(index) ^ expectedB64.charCodeAt(index);
		return diff === 0;
	});
}
