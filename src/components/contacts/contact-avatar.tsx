"use client";

import { useEffect, useState } from "react";
import { ProgressiveAvatarImage } from "@/components/progressive-avatar-image";
import { CONTACT_AVATAR_CHANGED_EVENT } from "@/lib/contacts/avatar-client";
import { normalizeEmailAddress } from "@/lib/email/address";
import { getAvatarColorStyle } from "@/lib/avatar-colors";
import { cn } from "@/lib/utils";
import type { ContactAvatarProps } from "./contact-avatar-types";
import {
	getContactAvatarInitial,
	getManagedContactAvatarUrl,
} from "./contact-avatar-utils";

export function ContactAvatar({
	mailboxId,
	address,
	name,
	hasManagedAvatar = false,
	managedAvatarUrl,
	className,
}: ContactAvatarProps) {
	const [managedAvatar, setManagedAvatar] = useState(hasManagedAvatar);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [imageFailed, setImageFailed] = useState(false);
	const [avatarVersion, setAvatarVersion] = useState(0);

	useEffect(() => {
		setManagedAvatar(hasManagedAvatar);
		setAvatarUrl(null);
		setImageFailed(false);
		setAvatarVersion(0);
	}, [address, hasManagedAvatar, mailboxId, managedAvatarUrl]);

	useEffect(() => {
		function onAvatarChanged(event: Event) {
			const detail = (event as CustomEvent<{ email?: string; hasAvatar?: boolean }>).detail;
			if (detail?.email === normalizeEmailAddress(address)) {
				setManagedAvatar(!!detail.hasAvatar);
				setAvatarVersion(Date.now());
			}
		}

		window.addEventListener(CONTACT_AVATAR_CHANGED_EVENT, onAvatarChanged);
		return () => window.removeEventListener(CONTACT_AVATAR_CHANGED_EVENT, onAvatarChanged);
	}, [address]);

	useEffect(() => {
		setImageFailed(false);
		if (managedAvatarUrl) {
			setAvatarUrl(managedAvatarUrl);
			return;
		}
		if (managedAvatar && mailboxId) {
			setAvatarUrl(getManagedContactAvatarUrl(mailboxId, address, avatarVersion));
			return;
		}
		setAvatarUrl(null);
	}, [address, avatarVersion, mailboxId, managedAvatar, managedAvatarUrl]);

	return (
		<span
			className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700", className)}
			style={getAvatarColorStyle(normalizeEmailAddress(address) || name)}
			aria-hidden
		>
			{getContactAvatarInitial(name, address)}
			{avatarUrl && !imageFailed && (
				<ProgressiveAvatarImage
					src={avatarUrl}
					alt=""
					className="absolute inset-0 h-full w-full object-cover"
					onError={() => {
						if (managedAvatarUrl) setImageFailed(true);
						else if (managedAvatar) setManagedAvatar(false);
						else setImageFailed(true);
					}}
				/>
			)}
		</span>
	);
}
