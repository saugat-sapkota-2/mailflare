import { webcrypto } from "node:crypto";

function base64Url(bytes) {
	return Buffer.from(bytes).toString("base64url");
}

const pair = await webcrypto.subtle.generateKey(
	{ name: "ECDSA", namedCurve: "P-256" },
	true,
	["sign", "verify"],
);
const publicKey = new Uint8Array(await webcrypto.subtle.exportKey("raw", pair.publicKey));
const privateJwk = await webcrypto.subtle.exportKey("jwk", pair.privateKey);

if (!privateJwk.d) throw new Error("Generated VAPID private key is missing its scalar");

console.log(`VAPID_PUBLIC_KEY=${base64Url(publicKey)}`);
console.log(`VAPID_PRIVATE_KEY=${privateJwk.d}`);
console.log("VAPID_SUBJECT=mailto:admin@example.com");
