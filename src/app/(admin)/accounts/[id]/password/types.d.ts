import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Translator } from "@/lib/i18n/utils";
import type { ManagedAccount } from "../types";

export type PasswordSaveOptions = {
	event: FormEvent<HTMLFormElement>;
	account: ManagedAccount | null;
	password: string;
	setPassword: Dispatch<SetStateAction<string>>;
	setSaving: Dispatch<SetStateAction<boolean>>;
	setMessage: Dispatch<SetStateAction<string | null>>;
	t?: Translator;
};
