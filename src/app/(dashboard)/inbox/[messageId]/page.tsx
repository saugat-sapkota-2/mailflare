"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Cloud, ExternalLink } from "lucide-react";
import dayjs from "dayjs";
import { MarkAsRead } from "@/components/mark-read";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { ContactDetailsTrigger } from "@/components/contacts/contact-details";
import { MessageActions } from "@/components/message-actions/message-actions";
import { MessageAttachmentViewer } from "@/components/message-attachment-viewer";
import { MessageAttachmentCard } from "@/components/message-attachment-card";
import { MessageDetailSkeleton } from "@/components/page-skeletons";
import { usePageLoading } from "@/components/page-loading";
import { PreviousMessage } from "@/components/previous-message";
import { getMessageBackHref } from "@/components/message-actions/utils";
import type { MessageAttachment, MessageDetailResponse } from "./types";
import {
  fetchMessageDetail,
  fetchMessageMetadata,
  getCachedMessageDetailForDisplay,
  getMessageBodyDisplay,
  getMessageHeaderParties,
  resolveInlineAttachmentUrls,
} from "./utils";
import { extractCloudAttachments } from "./cloud-attachment-utils";
import { sanitizeEmailHtml } from "./email-html-sanitizer";

export default function MessageDetailPage() {
  const params = useParams<{ messageId: string }>();
  const { selectedMailbox } = useSelectedMailbox();
  const messageId = params.messageId;
  const [data, setData] = useState<MessageDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAttachment, setPreviewAttachment] =
    useState<MessageAttachment | null>(null);
  usePageLoading(loading);

  useEffect(() => {
    let cancelled = false;

    async function loadMessage() {
      const cachedData = getCachedMessageDetailForDisplay(messageId);
      if (cachedData?.message && cachedData.body) {
        setData(cachedData);
        setLoading(false);
        if (cachedData.attachments !== undefined) return;
        try {
          const metadata = await fetchMessageMetadata(messageId);
          if (!cancelled) setData((current) => current ? { ...current, ...metadata } : current);
        } catch {
          // The message body remains usable if supplemental metadata is unavailable.
        }
        return;
      }
      setLoading(true);
      const nextData = await fetchMessageDetail(messageId);
      if (!cancelled) {
        setData(nextData);
        setLoading(false);
      }
    }

    void loadMessage();
    return () => {
      cancelled = true;
    };
  }, [messageId]);

  if (loading) {
    return <MessageDetailSkeleton />;
  }

  if (!data?.message) {
    return (
      <p className="px-6 py-4 text-sm text-neutral-500">
        {data?.error ?? "Message not found"}
      </p>
    );
  }

  const { message, body, attachments = [] } = data;
  const currentAccountName =
    selectedMailbox?.displayName ?? selectedMailbox?.localPart;
  const { fromName, fromAddress, toName } = getMessageHeaderParties(
    message,
    currentAccountName,
  );
  const ownAddress =
    message.direction === "inbound" ? message.toAddr : message.fromAddr;
  const bodyDisplay = getMessageBodyDisplay(
    body?.textBody,
    body?.htmlBody,
    message.snippet,
    ownAddress,
  );
  const htmlBody = sanitizeEmailHtml(
    resolveInlineAttachmentUrls(bodyDisplay.htmlBody, message.id, attachments),
  );
  const cloudAttachmentResult = extractCloudAttachments(
    bodyDisplay.latestContent,
  );

  return (
    <div className="h-full overflow-y-auto overscroll-contain scrollbar-gutter-stable">
      {message.direction === "inbound" && !message.read && (
        <MarkAsRead messageId={message.id} />
      )}
      <div className="flex pt-3 pb-2.75 items-center justify-between px-2 border-b border-neutral-200 sticky top-0 bg-white">
        <div className="flex-1" />
        {/* <div className="flex items-center flex-row gap-6">
					<Link
						href={getMessageBackHref(message.direction, message.status)}
						className="rounded-full p-2 text-neutral-600 hover:bg-neutral-100"
					>
						<ArrowLeft className="h-5 w-5" />
					</Link>
				</div> */}
        <MessageActions
          messageId={message.id}
          mailboxId={message.mailboxId}
          senderAddress={message.fromAddr}
          direction={message.direction}
          status={message.status}
          read={message.read}
          unsubscribeUrl={data.unsubscribeUrl}
          subject={message.subject}
          bodyText={body?.textBody}
          ownAddress={ownAddress}
        />
      </div>
      <article className="px-6 py-4">
        <h1 className="text-2xl text-neutral-900 mb-4">
          {message.subject ?? "(no subject)"}
        </h1>

        <div className="mb-6 flex items-start justify-between border-b border-neutral-100 pb-5">
          <div>
            <p className="text-sm text-neutral-900">
              <b>
                {message.direction === "inbound" ? (
                  <ContactDetailsTrigger
                    mailboxId={message.mailboxId}
                    address={message.fromAddr}
                    name={fromName}
                  />
                ) : (
                  fromName
                )}
              </b>{" "}
              <span className="text-neutral-500">&lt;{fromAddress}&gt;</span>
            </p>
            <p className="text-xs text-neutral-500">
              to{" "}
              {message.direction === "outbound" ? (
                <ContactDetailsTrigger
                  mailboxId={message.mailboxId}
                  address={message.toAddr}
                  name={toName}
                />
              ) : (
                toName
              )}
            </p>
          </div>
          <p className="text-xs text-neutral-400">
            {dayjs(message.createdAt).format("MMM DD, YYYY, hh:mmA")}
          </p>
        </div>
        <div className="prose max-w-none text-neutral-900">
          {htmlBody ? (
            <div className="mx-auto" dangerouslySetInnerHTML={{ __html: htmlBody }} />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text mx-auto">
              {cloudAttachmentResult.content}
            </pre>
          )}
          {bodyDisplay.quotedContent.map((quotedContent) => (
            <PreviousMessage
              key={`${quotedContent.dateLine}-${quotedContent.content.slice(0, 24)}`}
              message={quotedContent}
            />
          ))}
        </div>
        {cloudAttachmentResult.attachments.length > 0 && (
          <section className="mt-8 border-t border-neutral-100 py-6">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">
              Cloud files ({cloudAttachmentResult.attachments.length})
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {cloudAttachmentResult.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 text-left hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <Cloud className="h-5 w-5 shrink-0 text-blue-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-900">
                      {attachment.filename}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      Open from {attachment.provider}
                    </span>
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-neutral-400" />
                </a>
              ))}
            </div>
          </section>
        )}
        {attachments.length > 0 && (
          <section className="mt-8 border-t border-neutral-100 py-6">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">
              Attachments ({attachments.length})
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {attachments.map((attachment) => (
                <MessageAttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  messageId={message.id}
                  onPreview={setPreviewAttachment}
                />
              ))}
            </div>
          </section>
        )}
      </article>
      <MessageAttachmentViewer
        attachment={previewAttachment}
        messageId={message.id}
        open={previewAttachment !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
      />
    </div>
  );
}
