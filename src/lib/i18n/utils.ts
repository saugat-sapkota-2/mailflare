import en from "./en.json";
import { DEFAULT_LOCALE, locales } from "./locales";
import type { Locale, Messages, PluralKey, TranslationKey } from "./types";

export { DEFAULT_LOCALE } from "./locales";
export const LOCALE_COOKIE = "mailflare-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function resolveLocale(value: unknown): Locale {
	return typeof value === "string" && Object.hasOwn(locales, value) ? value as Locale : DEFAULT_LOCALE;
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
	return (locales[locale] as { dir?: "rtl" }).dir ?? "ltr";
}

/** Fetches the catalog for a locale; English is already bundled, others load on demand. */
export async function loadMessages(locale: Locale): Promise<Partial<Messages>> {
	return locales[locale].load();
}

export type TranslationVars = Record<string, string | number | null | undefined>;
export type Translator = (key: TranslationKey | PluralKey, vars?: TranslationVars) => string;

function interpolate(template: string, vars?: TranslationVars): string {
	if (!vars) return template;
	return template.replace(/\{(\w+)\}/g, (match, name: string) => (Object.hasOwn(vars, name) ? String(vars[name] ?? "") : match));
}

export function translate(messages: Partial<Messages>, key: TranslationKey, vars?: TranslationVars): string {
	return interpolate(messages[key] ?? en[key] ?? key, vars);
}

// Server-safe translator. A numeric `count` var selects a plural variant: with
// `inbox.unread.one` / `inbox.unread.other` catalog entries, `t("inbox.unread", { count })`
// uses the locale's CLDR category and falls back to the bare key when no variant exists.
export function createTranslator(locale: Locale, messages: Partial<Messages> = en): Translator {
	const rules = new Intl.PluralRules(locale);
	const known = (key: string) => key in messages || key in en;
	return (key, vars) => {
		const count = vars?.count;
		if (typeof count === "number") {
			for (const category of [rules.select(count), "other"]) {
				const variant = `${key}.${category}`;
				if (known(variant)) return translate(messages, variant as TranslationKey, vars);
			}
		}
		return translate(messages, key as TranslationKey, vars);
	};
}

export function serializeLocaleCookie(locale: Locale, secure: boolean): string {
	return `${LOCALE_COOKIE}=${resolveLocale(locale)}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** Default for pure helpers that take an optional translator, so callers without one (and tests) get English. */
export const defaultTranslator: Translator = createTranslator(DEFAULT_LOCALE, en);
