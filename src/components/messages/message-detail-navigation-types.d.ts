import type { ReactNode } from "react";
import type { MessageNavigationEntry } from "@/app/api/messages/navigation/types";
import type { MessageFolderConfig } from "./types";

export type MessageDetailNavigationProviderProps = {
	children: ReactNode;
	config: MessageFolderConfig;
};

export type MessageDetailNavigationProps = {
	messageId: string;
	unread: boolean;
};

export type MessageDetailNavigationSnapshot = {
	key: string;
	entries: MessageNavigationEntry[];
};

export type OpenedUnreadMessages = {
	key: string;
	ids: Set<string>;
};

export type MessageDetailNavigationContextValue = {
	entries: MessageNavigationEntry[];
	hrefPrefix: string;
	recordUnread: (messageId: string) => void;
};

export type MessageDetailNavigationState = {
	previousId: string | null;
	nextId: string | null;
	unreadOrder: number;
	totalUnread: number;
};
