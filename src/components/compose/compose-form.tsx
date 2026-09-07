"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Minimize2, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { authFetch } from "@/lib/auth/client";
import { formatEmailAddress, getEmailAddress } from "@/lib/email/address";
import { cn } from "@/lib/utils";
import { applyMailboxSignature, buildSendFormData, fetchDraft, formatAttachmentSize } from "./utils";
import type { ComposeAttachment } from "./types";

type Toast = { type: "success" | "error"; message: string } | null;

export function ComposeForm({
	mode = "page",
	draftIdToLoad,
	onClose,
}: {
	mode?: "page" | "popup";
	draftIdToLoad?: string | null;
	onClose?: () => void;
}) {
	const { selectedMailbox, setSelectedMailbox, mailboxes } = useSelectedMailbox();
	const [draftId, setDraftId] = useState<string | null>(null);
	const [to, setTo] = useState("");
	const [subject, setSubject] = useState("");
	const [text, setText] = useState("");
	const [attachments, setAttachments] = useState<ComposeAttachment[]>([]);
	const [toast, setToast] = useState<Toast>(null);
	const [loading, setLoading] = useState(false);
	const [loadingDraft, setLoadingDraft] = useState(false);
	const [loadedDraftMailboxId, setLoadedDraftMailboxId] = useState<string | null>(null);
	const [loadedDraftFrom, setLoadedDraftFrom] = useState<string | null>(null);
	const [selectedFrom, setSelectedFrom] = useState("");
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const attachmentInput = useRef<HTMLInputElement | null>(null);
	const previousSignature = useRef("");

	useEffect(() => {
		if (!selectedMailbox && mailboxes.length === 1) setSelectedMailbox(mailboxes[0]);
	}, [mailboxes, selectedMailbox, setSelectedMailbox]);

	const senderAddresses = useMemo(() => {
		if (!selectedMailbox) return [];
		return selectedMailbox.senderAddresses?.length
			? selectedMailbox.senderAddresses
			: [`${selectedMailbox.localPart}@${selectedMailbox.hostname}`];
	}, [selectedMailbox]);
	const senderOptions = useMemo(
		() => mailboxes.flatMap((mailbox) => {
			const addresses = mailbox.senderAddresses?.length
				? mailbox.senderAddresses
				: [`${mailbox.localPart}@${mailbox.hostname}`];
			return addresses.map((address) => ({ mailbox, address }));
		}),
		[mailboxes],
	);
	const fromAddr = selectedMailbox && selectedFrom
		? formatEmailAddress(selectedFrom, selectedMailbox.displayName)
		: "";

	useEffect(() => {
		if (!senderAddresses.length) {
			setSelectedFrom("");
			return;
		}
		if (!senderAddresses.includes(selectedFrom)) setSelectedFrom(senderAddresses[0]);
	}, [selectedFrom, senderAddresses]);

	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(() => setToast(null), 3200);
		return () => clearTimeout(timer);
	}, [toast]);

	useEffect(() => {
		if (!draftIdToLoad) return;

		let cancelled = false;
		setLoadingDraft(true);
		fetchDraft(draftIdToLoad)
			.then((draft) => {
				if (cancelled) return;

				setDraftId(draft.id);
				setTo(draft.toAddr);
				setSubject(draft.subject ?? "");
				setText(draft.textBody ?? "");
				setLoadedDraftMailboxId(draft.mailboxId);
				setLoadedDraftFrom(getEmailAddress(draft.fromAddr).toLowerCase());
			})
			.catch((err) => {
				if (cancelled) return;
				const message = err instanceof Error ? err.message : "Failed to load draft";
				setToast({ type: "error", message });
			})
			.finally(() => {
				if (!cancelled) setLoadingDraft(false);
			});

		return () => {
			cancelled = true;
		};
	}, [draftIdToLoad]);

	useEffect(() => {
		if (!loadedDraftMailboxId) return;
		if (selectedMailbox?.id === loadedDraftMailboxId) return;

		const draftMailbox = mailboxes.find((mailbox) => mailbox.id === loadedDraftMailboxId);
		if (draftMailbox) setSelectedMailbox(draftMailbox);
	}, [loadedDraftMailboxId, mailboxes, selectedMailbox?.id, setSelectedMailbox]);

	useEffect(() => {
		if (!loadedDraftFrom || !senderAddresses.includes(loadedDraftFrom)) return;
		setSelectedFrom(loadedDraftFrom);
	}, [loadedDraftFrom, senderAddresses]);

	useEffect(() => {
		if (loadingDraft) return;
		const nextSignature = selectedMailbox?.signature ?? "";
		setText((current) => applyMailboxSignature(current, previousSignature.current, nextSignature));
		previousSignature.current = nextSignature;
	}, [loadingDraft, selectedMailbox?.id, selectedMailbox?.signature]);

	useEffect(() => {
		const bodyContent = text.trim();
		const signatureOnly = bodyContent === (selectedMailbox?.signature?.trim() ?? "");
		const hasContent = to.trim() || subject.trim() || (bodyContent && !signatureOnly);
		if (!fromAddr || !hasContent || loadingDraft) return;
		if (saveTimer.current) clearTimeout(saveTimer.current);

		saveTimer.current = setTimeout(async () => {
			const payload = {
				mailboxId: selectedMailbox?.id,
				from: fromAddr,
				to,
				subject,
				text,
			};
			const res = await authFetch(draftId ? `/api/drafts/${draftId}` : "/api/drafts", {
				method: draftId ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = (await res.json()) as { draft?: { id: string } };
			if (res.ok && data.draft?.id) setDraftId(data.draft.id);
		}, 900);

		return () => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
		};
	}, [draftId, fromAddr, loadingDraft, selectedMailbox?.id, selectedMailbox?.signature, subject, text, to]);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		const res = await authFetch("/api/send", {
			method: "POST",
			body: buildSendFormData({
				attachments,
				from: fromAddr,
				to,
				subject,
				text,
				mailboxId: selectedMailbox?.id,
			}),
		});
		const data = (await res.json()) as { messageId?: string; error?: string };
		setLoading(false);

		if (!res.ok) {
			setToast({ type: "error", message: data.error ?? "Send failed" });
			return;
		}

		if (draftId) {
			void authFetch(`/api/drafts/${draftId}`, { method: "DELETE" }).finally(() => {
				window.dispatchEvent(new Event("mailflare:messages-changed"));
			});
		}
		setDraftId(null);
		setTo("");
		setSubject("");
		setText(applyMailboxSignature("", "", selectedMailbox?.signature));
		setAttachments([]);
		setToast({ type: "success", message: "Message sent" });
		window.dispatchEvent(new Event("mailflare:messages-changed"));
	}

	function addAttachments(files: FileList | null) {
		if (!files) return;
		const nextFiles = Array.from(files);
		const nextCount = attachments.length + nextFiles.length;
		const totalSize = [...attachments.map((attachment) => attachment.file), ...nextFiles].reduce(
			(total, file) => total + file.size,
			0,
		);

		if (nextCount > 10) {
			setToast({ type: "error", message: "A message can include at most 10 attachments" });
			return;
		}
		if (nextFiles.some((file) => file.size > 10 * 1024 * 1024)) {
			setToast({ type: "error", message: "Each attachment must be 10 MB or smaller" });
			return;
		}
		if (totalSize > 20 * 1024 * 1024) {
			setToast({ type: "error", message: "Attachments must total 20 MB or less" });
			return;
		}

		setAttachments((current) => [
			...current,
			...nextFiles.map((file) => ({ id: crypto.randomUUID(), file })),
		]);
		if (attachmentInput.current) attachmentInput.current.value = "";
	}

	function selectSender(value: string) {
		const option = senderOptions.find((item) => `${item.mailbox.id}|${item.address}` === value);
		if (!option) return;
		setSelectedFrom(option.address);
		if (selectedMailbox?.id !== option.mailbox.id) setSelectedMailbox(option.mailbox);
	}

	const frameClass =
		mode === "popup"
			? "fixed bottom-4 right-4 z-40 flex h-[min(520px,calc(100vh-88px))] w-[min(560px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xl"
			: "flex h-full min-h-[720px] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm";

	return (
		<>
			{toast && (
				<div
					className={cn(
						"fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg",
						toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white",
					)}
				>
					{toast.message}
				</div>
			)}
			<form onSubmit={onSubmit} className={frameClass}>
				<div className="flex h-9 items-center justify-between bg-neutral-800 px-4 text-sm font-medium text-white">
					<span>{loadingDraft ? "Loading draft" : draftId ? "Draft saved" : "New Message"}</span>
					{mode === "popup" && (
						<div className="flex items-center gap-3 text-neutral-300">
							<Minimize2 className="h-4 w-4" />
							<button type="button" onClick={onClose}>
								<X className="h-4 w-4" />
							</button>
						</div>
					)}
				</div>
				<div className="border-b border-neutral-100 px-4 py-1">
					<Label htmlFor={`${mode}-from`} className="sr-only">From</Label>
					<Select
						id={`${mode}-from`}
						value={selectedMailbox && selectedFrom ? `${selectedMailbox.id}|${selectedFrom}` : ""}
						onChange={(event) => selectSender(event.target.value)}
						placeholder="Select a mailbox first"
						required
						disabled={loadingDraft || senderOptions.length === 0}
						className="h-8 border-0 px-0 py-1 text-sm shadow-none focus-visible:ring-0"
					>
						{senderOptions.length === 0 && <option value="">Select a mailbox first</option>}
						{senderOptions.map(({ mailbox, address }) => (
							<option key={`${mailbox.id}|${address}`} value={`${mailbox.id}|${address}`}>{address}</option>
						))}
					</Select>
				</div>
				<div className="border-b border-neutral-100 px-4 py-1">
					<Label htmlFor={`${mode}-to`} className="sr-only">To</Label>
					<Input
						id={`${mode}-to`}
						value={to}
						onChange={(event) => setTo(event.target.value)}
						type="text"
						placeholder='Recipients, or "Maya Chen" <maya@example.com>'
						required
						disabled={loadingDraft}
						className="h-8 border-0 px-0 py-1 shadow-none focus-visible:ring-0"
					/>
				</div>
				<div className="border-b border-neutral-100 px-4 py-1">
					<Label htmlFor={`${mode}-subject`} className="sr-only">Subject</Label>
					<Input
						id={`${mode}-subject`}
						value={subject}
						onChange={(event) => setSubject(event.target.value)}
						placeholder="Subject"
						required
						disabled={loadingDraft}
						className="h-8 border-0 px-0 py-1 shadow-none focus-visible:ring-0"
					/>
				</div>
				<div className="min-h-0 flex-1 px-4 py-2">
					<Label htmlFor={`${mode}-text`} className="sr-only">Body</Label>
					<Textarea
						id={`${mode}-text`}
						value={text}
						onChange={(event) => setText(event.target.value)}
						disabled={loadingDraft}
						className="h-full min-h-full resize-none border-0 px-0 shadow-none focus-visible:ring-0"
					/>
				</div>
				{attachments.length > 0 && (
					<div className="flex flex-wrap gap-2 border-t border-neutral-100 px-4 py-3">
						{attachments.map((attachment) => (
							<div
								key={attachment.id}
								className="flex max-w-full items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
							>
								<FileText className="h-4 w-4 shrink-0 text-neutral-500" />
								<span className="max-w-48 truncate">{attachment.file.name}</span>
								<span className="text-xs text-neutral-400">
									{formatAttachmentSize(attachment.file.size)}
								</span>
								<button
									type="button"
									onClick={() =>
										setAttachments((current) =>
											current.filter((item) => item.id !== attachment.id),
										)
									}
									className="rounded-full p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
								>
									<X className="h-3.5 w-3.5" />
									<span className="sr-only">Remove attachment</span>
								</button>
							</div>
						))}
					</div>
				)}
				<div className="flex items-center gap-3 border-t border-neutral-100 px-4 py-3">
					<Input
						ref={attachmentInput}
						type="file"
						multiple
						className="hidden"
						onChange={(event) => addAttachments(event.target.files)}
					/>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => attachmentInput.current?.click()}
						disabled={loading || loadingDraft}
					>
						<Paperclip className="h-4 w-4" />
						Attach
					</Button>
					<span className="flex-1" />
					<p className="text-xs text-neutral-500">{draftId ? "Saved to drafts" : "Autosaves as draft"}</p>
					<Button type="submit" disabled={loading || loadingDraft || !fromAddr} className="rounded-full px-5">
						<Send className="h-4 w-4" />
						{loading ? "Sending" : "Send"}
					</Button>
				</div>
			</form>
		</>
	);
}
