import { defaultTranslator } from "@/lib/i18n/utils";
import { saveManagedAccount } from "../utils";
import type { PasswordSaveOptions } from "./types";

export async function saveAccountPassword({ event, account, password, setPassword, setSaving, setMessage, t = defaultTranslator }: PasswordSaveOptions) {
	event.preventDefault();
	if (!account) return;
	setSaving(true);
	setMessage(null);
	try {
		await saveManagedAccount({ ...account, newPassword: password });
		setPassword("");
		setMessage(t("account.password.resetDone"));
	} catch (error) {
		setMessage(error instanceof Error ? error.message : t("account.password.resetFailed"));
	} finally {
		setSaving(false);
	}
}
