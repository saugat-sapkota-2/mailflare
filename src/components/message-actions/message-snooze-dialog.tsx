"use client";

import { useState } from "react";
import { getSnoozePresets, snoozeMessage } from "@/components/messages/message-list-row-actions-utils";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { MessageSnoozeDialogProps } from "./types";
import { getUserTimeZone } from "@/lib/time/utils";

export function MessageSnoozeDialog({ messageId, open, onOpenChange }: MessageSnoozeDialogProps) {
	const { t } = useLanguage();
	const [snoozedUntil, setSnoozedUntil] = useState(() => getSnoozePresets()[0].value);
	const [snoozing, setSnoozing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const snoozePresets = getSnoozePresets();

	async function handleSnooze() {
		setSnoozing(true);
		setError(null);
		try {
			await snoozeMessage(messageId, snoozedUntil);
			onOpenChange(false);
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : t("snooze.failed"));
		} finally {
			setSnoozing(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("snooze.title")}</DialogTitle>
					<DialogDescription>{t("snooze.description")}</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="grid gap-2 sm:grid-cols-3">
						{snoozePresets.map((preset) => (
							<Button key={preset.labelKey} type="button" variant="outline" size="sm" onClick={() => setSnoozedUntil(preset.value)}>
								{t(preset.labelKey)}
							</Button>
						))}
					</div>
					<div className="space-y-2">
						<label htmlFor={`header-snooze-until-${messageId}`} className="text-sm font-medium text-neutral-700">{t("snooze.selectDateTime", { timeZone: getUserTimeZone() })}</label>
						<Input id={`header-snooze-until-${messageId}`} type="datetime-local" value={snoozedUntil} onChange={(event) => setSnoozedUntil(event.target.value)} />
					</div>
					{error && <p className="text-sm text-red-600">{error}</p>}
					<Button type="button" onClick={() => void handleSnooze()} disabled={snoozing}>
						{snoozing ? t("common.snoozing") : t("common.snooze")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
