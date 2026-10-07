export function getAvatarPreviewUrl(src: string): string {
	const url = new URL(src, "http://localhost");
	url.searchParams.set("variant", "preview");
	return `${url.pathname}${url.search}`;
}
