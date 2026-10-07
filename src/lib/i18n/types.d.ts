import type en from "./en.json";

export type { Locale } from "./locales";
export type TranslationKey = keyof typeof en;
export type Messages = Record<TranslationKey, string>;

type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";
/** A key whose catalog entries are `key.one`, `key.other`, etc.; pass `{ count }` to pick the variant. */
export type PluralKey = TranslationKey extends infer K ? (K extends `${infer Base}.${PluralCategory}` ? Base : never) : never;
