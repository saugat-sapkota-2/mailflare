import type { PermanentDeleteFolder } from "@/app/api/messages/bulk/types";
import { defaultTranslator, type Translator } from "../i18n/utils";

const folderLabelKeys = { trash: "navigation.trash", spam: "navigation.spam" } as const;

export function getPermanentDeleteFolderLabel(folder: PermanentDeleteFolder, t: Translator = defaultTranslator): string {
	return t(folderLabelKeys[folder]);
}

/** Whether the folder being viewed offers "Delete forever" and "Empty …". */
export function supportsPermanentDelete(folder: string | null | undefined): folder is PermanentDeleteFolder {
	return folder === "trash" || folder === "spam";
}

export function getEmptyFolderLabel(folder: PermanentDeleteFolder, t: Translator = defaultTranslator): string {
	return t("list.emptyFolder", { folder: getPermanentDeleteFolderLabel(folder, t) });
}

export function getPermanentDeleteConfirmText(count: number, t: Translator = defaultTranslator): string {
	return t("delete.confirm", { count });
}

export function getEmptyFolderConfirmText(folder: PermanentDeleteFolder, total?: number, t: Translator = defaultTranslator): string {
	const vars = { count: total ?? 0, folder: getPermanentDeleteFolderLabel(folder, t) };
	if (total === 1) return t("empty.confirm.single", vars);
	return total && total > 1 ? t("empty.confirm.multiple", vars) : t("empty.confirm.all", vars);
}
