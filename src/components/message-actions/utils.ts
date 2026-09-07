import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import { authFetch } from "@/lib/auth/client";
import { getEmailAddress } from "@/lib/email/address";
import { getLatestEmailContent } from "@/lib/email/reply-content-utils";
import type {
  BlockMessageContactInput,
  MoveMessageActionItem,
  ReplyDraftInput,
  TrashSenderRuleInput,
} from "./types";
import {
  ArchiveIcon,
  Inbox,
  InboxIcon,
  ShieldAlertIcon,
  ShieldIcon,
  Trash2Icon,
  TrashIcon,
} from "lucide-react";

export function getMessageBackHref(
  direction: "inbound" | "outbound",
  status: string,
) {
  if (status === "trash") return "/trash";
  if (status === "spam") return "/spam";
  if (status === "archived") return "/archived";
  if (status === "draft") return "/drafts";
  return direction === "inbound" ? "/inbox" : "/sent";
}

export async function runSingleMessageAction(
  messageId: string,
  action: BulkMessageAction,
) {
  const response = await authFetch("/api/messages/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageIds: [messageId], action }),
  });

  if (!response.ok) {
    throw new Error("Unable to update message");
  }

  window.dispatchEvent(new Event("mailflare:messages-changed"));
}

export function openUnsubscribeUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function confirmTrashWithoutUnsubscribe() {
  return window.confirm(
    "This email does not provide an unsubscribe link. It will be moved to Trash, and future emails from this sender will also be moved to Trash.",
  );
}

export async function createTrashSenderRule({
  mailboxId,
  senderAddress,
}: TrashSenderRuleInput) {
  const sender = getEmailAddress(senderAddress).trim().toLowerCase();
  if (!sender) throw new Error("Sender address is required");

  const response = await authFetch("/api/routing-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mailboxId,
      matchField: "email",
      matchOperator: "exact",
      matchValue: sender,
      destination: "trash",
      priority: 0,
    }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok)
    throw new Error(data.error ?? "Unable to create trash rule");
}

export async function blockMessageContact({
  mailboxId,
  senderAddress,
}: BlockMessageContactInput) {
  const response = await authFetch("/api/contacts/block", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mailboxId, address: senderAddress }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Unable to block contact");
}

export function getMoveMessageActions(
  status: string,
  direction: "inbound" | "outbound",
): MoveMessageActionItem[] {
  const actions: MoveMessageActionItem[] = [];
  if (status === "archived" && direction === "inbound") {
    actions.push({ action: "inbox", label: "Inbox", icon: InboxIcon });
  }
  if (status !== "archived")
    actions.push({ action: "archive", label: "Archived", icon: ArchiveIcon });
  if (status !== "spam")
    actions.push({ action: "spam", label: "Spam", icon: ShieldAlertIcon });
  if (status !== "trash")
    actions.push({ action: "trash", label: "Trash", icon: Trash2Icon });
  return actions;
}

export function getMessageActionRedirect(
  action: BulkMessageAction,
  direction: "inbound" | "outbound",
) {
  if (action === "trash") return "/trash";
  if (action === "spam") return "/spam";
  if (action === "archive") return "/archived";
  if (action === "inbox") return "/inbox";
  return null;
}

export function buildReplySubject(subject: string | null | undefined) {
  const trimmed = (subject ?? "").trim();
  if (!trimmed) return "Re:";
  return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

export function buildReplyQuote(
  senderAddress: string,
  bodyText: string | null | undefined,
) {
  const latest = getLatestEmailContent(bodyText).trim();
  if (!latest) return "";
  const quoted = latest
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return `\n\n${getEmailAddress(senderAddress)} wrote:\n${quoted}\n`;
}

export async function createReplyDraft({
  mailboxId,
  senderAddress,
  ownAddress,
  subject,
  bodyText,
}: ReplyDraftInput) {
  const to = getEmailAddress(senderAddress).trim();
  if (!to) throw new Error("Sender address is required");

  const response = await authFetch("/api/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mailboxId,
      // The API rejects the draft unless `from` matches the mailbox address.
      from: getEmailAddress(ownAddress ?? ""),
      to,
      subject: buildReplySubject(subject),
      text: buildReplyQuote(senderAddress, bodyText),
    }),
  });
  const data = (await response.json()) as {
    draft?: { id: string };
    error?: string;
  };
  if (!response.ok || !data.draft)
    throw new Error(data.error ?? "Unable to create reply draft");
  return data.draft.id;
}
