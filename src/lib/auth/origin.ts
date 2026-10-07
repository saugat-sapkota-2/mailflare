/** Call only after session authentication. Bearer tokens are not sent automatically by browsers. */
export function hasValidSessionMutationOrigin(request: Request): boolean {
	if (request.headers.get("Authorization")?.startsWith("Bearer ")) return true;
	const fetchSite = request.headers.get("Sec-Fetch-Site");
	if (fetchSite === "same-origin") return true;
	if (fetchSite === "cross-site" || fetchSite === "same-site") return false;
	const origin = request.headers.get("Origin");
	return origin !== null && origin === new URL(request.url).origin;
}
