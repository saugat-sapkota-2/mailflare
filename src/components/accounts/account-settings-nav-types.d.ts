import type { TranslationKey } from "@/lib/i18n/types";

export type AccountSettingsNavItem = {
	segment: "" | "password" | "permissions" | "mailboxes";
	labelKey: TranslationKey;
};
