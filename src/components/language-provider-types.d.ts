import type { Locale } from "@/lib/i18n/types";
import type { Translator } from "@/lib/i18n/utils";

export type LanguageState = {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: Translator;
};
