import { authFetch } from "@/lib/auth/client";
import type { MessageFilterOptions, MessageFolder } from "./types";
import type { MessageCounts, MessageListResponse } from "./types";

export const MESSAGE_POLL_INTERVAL_MS = 15_000;

export function parseMessageSearchQuery(query: string): MessageFilterOptions {
	let remaining = query;
	const filters: MessageFilterOptions = {};
	const titleMatch = remaining.match(/\btitle:"([^"]+)"/i) ?? remaining.match(/\btitle:([^\s]+)/i);

	if (titleMatch?.[1]) {
		filters.title = titleMatch[1].trim();
		remaining = remaining.replace(titleMatch[0], " ");
	}

	if (/(^|\s):unread(\s|$)/i.test(remaining)) {
		filters.read = "unread";
		remaining = remaining.replace(/(^|\s):unread(?=\s|$)/gi, " ");
	} else if (/(^|\s):read(\s|$)/i.test(remaining)) {
		filters.read = "read";
		remaining = remaining.replace(/(^|\s):read(?=\s|$)/gi, " ");
	}

	const textQuery = remaining.replace(/\s+/g, " ").trim();
	if (textQuery) filters.query = textQuery;

	return filters;
}

export function getMessageQueryParams(
	folder: MessageFolder,
	mailboxId?: string | null,
	filters?: MessageFilterOptions,
	folderId?: string | null,
) {
	const params = new URLSearchParams();

	if (folder === "inbox") {
		params.set("direction", "inbound");
		params.set("status", "received");
	}
	if (folder === "starred") params.set("starred", "true");
	if (folder === "snoozed") params.set("snoozed", "true");

	if (folder === "sent") {
		params.set("direction", "outbound");
		params.set("status", "sent");
	}

	if (folder === "drafts") {
		params.set("direction", "outbound");
		params.set("status", "draft");
	}

	if (folder === "archived" || folder === "trash" || folder === "spam") {
		params.set("status", folder);
	}

	if (folderId) params.set("folderId", folderId);
	if (mailboxId) params.set("mailboxId", mailboxId);
	const searchFilters = filters?.query ? parseMessageSearchQuery(filters.query) : null;
	const parsedFilters = searchFilters
		? { ...filters, ...searchFilters, read: filters?.read ?? searchFilters.read }
		: filters;
	if (parsedFilters?.query?.trim()) params.set("q", parsedFilters.query.trim());
	if (parsedFilters?.title?.trim()) params.set("title", parsedFilters.title.trim());
	if (parsedFilters?.read && parsedFilters.read !== "all") params.set("read", parsedFilters.read);
	if (filters?.limit) params.set("limit", String(filters.limit));
	if (filters?.offset) params.set("offset", String(filters.offset));

	return params;
}

const messageCountsCache = new Map<string, MessageCounts>();
const messageCountsRequests = new Map<string, Promise<MessageCounts | undefined>>();
const messageListCache = new Map<string, MessageListResponse>();
const messageListRequests = new Map<string, Promise<MessageListResponse>>();
let messageCacheGeneration = 0;
let messageCountsGeneration = 0;

export function clearMessageCountsCache() {
	messageCountsGeneration += 1;
	messageCountsCache.clear();
	messageCountsRequests.clear();
}

export function clearMessageListCache() {
	messageListCache.clear();
}

export function clearMessageClientState() {
	messageCacheGeneration += 1;
	messageCountsGeneration += 1;
	messageCountsCache.clear();
	messageCountsRequests.clear();
	messageListCache.clear();
	messageListRequests.clear();
}

export async function fetchMessageCounts(mailboxId?: string | null, force = false): Promise<MessageCounts | undefined> {
	const key = mailboxId ?? "all";
	if (!force && messageCountsCache.has(key)) return messageCountsCache.get(key);
	if (!force && messageCountsRequests.has(key)) return messageCountsRequests.get(key);

	const requestGeneration = messageCacheGeneration;
	const countsGeneration = messageCountsGeneration;
	const request = (async () => {
		const params = new URLSearchParams();
		if (mailboxId) params.set("mailboxId", mailboxId);
		const query = params.toString();
		const res = await authFetch(`/api/messages/counts${query ? `?${query}` : ""}`);
		const data = (await res.json()) as { counts?: MessageCounts };
		const counts = data.counts;
		if (
			counts &&
			requestGeneration === messageCacheGeneration &&
			countsGeneration === messageCountsGeneration
		) {
			messageCountsCache.set(key, counts);
		}
		return counts;
	})().finally(() => {
		if (messageCountsRequests.get(key) === request) {
			messageCountsRequests.delete(key);
		}
	});

	messageCountsRequests.set(key, request);
	return request;
}

export async function fetchMessageList(params: URLSearchParams, force = false): Promise<MessageListResponse> {
	const key = params.toString();
	if (!force && messageListCache.has(key)) return messageListCache.get(key) ?? {};
	if (messageListRequests.has(key)) return messageListRequests.get(key) ?? {};

	const requestGeneration = messageCacheGeneration;
	const request = authFetch(`/api/messages?${key}`)
		.then((res) => res.json())
		.then((data) => {
			const response = data as MessageListResponse;
			if (requestGeneration === messageCacheGeneration) {
				messageListCache.set(key, response);
			}
			return response;
		})
		.finally(() => {
			if (requestGeneration === messageCacheGeneration) {
				messageListRequests.delete(key);
			}
		});

	messageListRequests.set(key, request);
	return request;
}
