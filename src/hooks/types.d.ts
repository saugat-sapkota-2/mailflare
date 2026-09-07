export type MessageStatus = "received" | "sent" | "draft" | "queued" | "failed" | "archived" | "trash" | "spam";

export type MessageFolder = "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "archived" | "trash" | "spam";

export type MessageDirection = "inbound" | "outbound";

export type Message = {
	id: string;
	userId: string;
	mailboxId: string | null;
	folderId: string | null;
	direction: MessageDirection;
	providerMessageId: string | null;
	fromAddr: string;
	toAddr: string;
	fromContactName?: string | null;
	toContactName?: string | null;
	subject: string | null;
	snippet: string | null;
	textBody?: string | null;
	htmlBody?: string | null;
	status: MessageStatus | string;
	read: boolean;
	starred: boolean;
	snoozedUntil?: string | null;
	threadId: string | null;
	createdAt: string;
};

export type MessageReadFilter = "all" | "read" | "unread";

export type MessageFilterOptions = {
	query?: string;
	read?: MessageReadFilter;
	title?: string;
	limit?: number;
	offset?: number;
};

export type MessageListResponse = {
	messages?: Message[];
	total?: number;
	limit?: number;
	offset?: number;
};

export type FolderCount = {
	total: number;
	unread: number;
};

export type MailboxCount = {
	mailboxId: string;
	total: number;
	unread: number;
	inbox: number;
};

export type MessageCounts = {
	folders: Record<MessageFolder, FolderCount>;
	customFolders: Record<string, FolderCount>;
	mailboxes: MailboxCount[];
};

export type MessageCountsDelta = {
	inboxUnreadDelta?: number;
};
