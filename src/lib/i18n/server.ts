import { cookies } from "next/headers";
import { LOCALE_COOKIE, createTranslator, loadMessages, resolveLocale } from "./utils";

/** The locale chosen in the preference cookie, for server code that must render in it. */
export async function getRequestLocale() {
	return resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

// For server components and route handlers; client components use `useLanguage()`.
export async function getServerTranslator() {
	const locale = await getRequestLocale();
	return createTranslator(locale, await loadMessages(locale));
}
