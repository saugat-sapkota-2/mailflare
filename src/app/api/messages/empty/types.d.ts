import type { PermanentDeleteFolder } from "../bulk/types";

export type EmptyFolderPayload = {
	mailboxId?: string;
	folder?: PermanentDeleteFolder;
};

export type EmptyFolderResponse = {
	ok?: boolean;
	deleted?: number;
	remaining?: number;
	error?: string;
};
