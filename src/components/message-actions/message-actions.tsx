"use client";

import { createElement, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Ban, BellOff, Mail, MailOpen, MoreVertical, Reply, ShieldAlert, Trash2 } from "lucide-react";
import { useCompose } from "@/components/compose/compose-context";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import type { MessageActionsProps } from "./types";
import {
	confirmTrashWithoutUnsubscribe,
	blockMessageContact,
	createReplyDraft,
	createTrashSenderRule,
	getMessageActionRedirect,
	getMoveMessageActions,
	openUnsubscribeUrl,
	runSingleMessageAction,
} from "./utils";

export function MessageActions({
	messageId,
	mailboxId,
	senderAddress,
	direction,
	status,
	read,
	unsubscribeUrl,
	subject,
	bodyText,
	ownAddress,
}: MessageActionsProps) {
	const router = useRouter();
	const { openDraftComposer } = useCompose();
	const [pendingAction, setPendingAction] = useState<
		BulkMessageAction | "unsubscribe" | "reply" | "block" | null
	>(null);
	const [error, setError] = useState<string | null>(null);
	const [moreOpen, setMoreOpen] = useState(false);

	async function runAction(action: BulkMessageAction) {
		setMoreOpen(false);
		setPendingAction(action);
		setError(null);
		try {
			await runSingleMessageAction(messageId, action);
			const redirect = getMessageActionRedirect(action, direction);
			if (redirect) router.push(redirect);
			router.refresh();
		} catch {
			setError("Could not update message");
		} finally {
			setPendingAction(null);
		}
	}

	async function onUnsubscribe() {
		setMoreOpen(false);
		setError(null);
		if (unsubscribeUrl) {
			openUnsubscribeUrl(unsubscribeUrl);
			return;
		}

		if (!confirmTrashWithoutUnsubscribe()) return;
		setPendingAction("unsubscribe");
		if (!mailboxId) {
			setError("Could not create trash rule");
			setPendingAction(null);
			return;
		}

		try {
			await createTrashSenderRule({ mailboxId, senderAddress });
			await runAction("trash");
		} catch {
			setError("Could not create trash rule");
			setPendingAction(null);
		}
	}

	async function handleReply() {
		setPendingAction("reply");
		setError(null);
		try {
			const draftId = await createReplyDraft({
				mailboxId,
				senderAddress,
				ownAddress,
				subject,
				bodyText,
			});
			openDraftComposer(draftId);
		} catch (replyError) {
			setError(replyError instanceof Error ? replyError.message : "Could not start reply");
		} finally {
			setPendingAction(null);
		}
	}

	async function onBlockContact() {
		setMoreOpen(false);
		setError(null);
		if (!mailboxId) {
			setError("Could not block contact");
			return;
		}

		setPendingAction("block");
		try {
			await blockMessageContact({ mailboxId, senderAddress });
			await runSingleMessageAction(messageId, "trash");
			router.push("/trash");
			router.refresh();
		} catch (blockError) {
			setError(blockError instanceof Error ? blockError.message : "Could not block contact");
		} finally {
			setPendingAction(null);
		}
	}

	const disabled = pendingAction !== null;
	const markAction: BulkMessageAction = read ? "unread" : "read";
	const moveActions = getMoveMessageActions(status, direction);

	return (
		<div className="flex items-center gap-3 text-neutral-600">
			{error && <span className="text-xs text-red-600">{error}</span>}
			<div className="flex items-center gap-2">
				<Tooltip label="Reply">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						aria-label="Reply"
						disabled={disabled}
						onClick={handleReply}
					>
						<Reply className="h-5 w-5" />
					</Button>
				</Tooltip>
				<Tooltip label="Archive">
					<Button
						variant="ghost"
						size="sm"
						aria-label="Archive"
						disabled={disabled || status === "archived"}
						onClick={() => runAction("archive")}
					>
						<Archive className="h-5 w-5" />
					</Button>
				</Tooltip>
				<Tooltip label="Report spam">
					<Button
						variant="ghost"
						size="sm"
						aria-label="Report spam"
						disabled={disabled || status === "spam" || direction !== "inbound"}
						onClick={() => runAction("spam")}
					>
						<ShieldAlert className="h-5 w-5" />
					</Button>
				</Tooltip>
				<Tooltip label="Delete">
					<Button
						variant="ghost"
						size="sm"
						aria-label="Move to trash"
						disabled={disabled || status === "trash"}
						onClick={() => runAction("trash")}
					>
						<Trash2 className="h-5 w-5" />
					</Button>
				</Tooltip>
				<Tooltip label={read ? "Mark as unread" : "Mark as read"}>
					<Button
						variant="ghost"
						size="sm"
						aria-label={read ? "Mark as unread" : "Mark as read"}
						disabled={disabled}
						onClick={() => runAction(markAction)}
					>
						{read ? <Mail className="h-5 w-5" /> : <MailOpen className="h-5 w-5" />}
					</Button>
				</Tooltip>
				<div className="relative">
					<Tooltip label="More actions">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							aria-label="More actions"
							aria-expanded={moreOpen}
							disabled={disabled}
							onClick={() => setMoreOpen((open) => !open)}
						>
							<MoreVertical className="h-5 w-5" />
						</Button>
					</Tooltip>
					{moreOpen && (
						<div className="absolute right-0 z-20 mt-2 w-54 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
							{direction === "inbound" && (
								<>
									<button
										type="button"
									className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400"
									disabled={!unsubscribeUrl && status === "trash"}
									onClick={() => void onUnsubscribe()}
								>
									<BellOff className="h-4 w-4 shrink-0" />
									Unsubscribe
									</button>
									<button
										type="button"
									className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
										onClick={() => void onBlockContact()}
									>
										<Ban className="h-4 w-4" />
										Block contact
									</button>
							<hr className="my-1 border-neutral-100" />
								</>
							)}
							<p className="mt-1 px-3 pb-1 pt-2 text-sm font-medium text-neutral-500">
								Move to
							</p>
							{moveActions.map((item) => (
								<button
									key={item.action}
									type="button"
									className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
									onClick={() => void runAction(item.action)}
								>
									{createElement(item.icon, { size: 16 })}
									{item.label}
								</button>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
