"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadGeneralSettings, saveGeneralSettings } from "./utils";

export default function GeneralSettingsPage() {
	const { t } = useLanguage();
	const [maxMb, setMaxMb] = useState(25);
	const [loaded, setLoaded] = useState(false);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState("");

	useEffect(() => {
		let active = true;
		void loadGeneralSettings().then((settings) => {
			if (active) { setMaxMb(settings.outboundAttachmentMaxMb); setLoaded(true); }
		}).catch((error) => { if (active) setStatus(error instanceof Error ? error.message : t("general.loadFailed")); });
		return () => { active = false; };
	}, [t]);

	async function save(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setStatus("");
		try {
			const settings = await saveGeneralSettings(maxMb);
			setMaxMb(settings.outboundAttachmentMaxMb);
			setStatus(t("general.saved"));
		} catch (error) {
			setStatus(error instanceof Error ? error.message : t("general.saveFailed"));
		} finally { setSaving(false); }
	}

	return <div className="space-y-6">
		<div><h1 className="text-2xl md:text-3xl font-medium text-neutral-900">{t("general.title")}</h1><p className="mt-2 text-sm text-neutral-500">{t("general.description")}</p></div>
		<Card className="rounded-3xl border-0 bg-white p-6">
			<CardHeader className="py-0"><CardTitle>{t("general.attachments")}</CardTitle></CardHeader>
			<CardContent className="pt-6"><form onSubmit={save} className="space-y-4">
				<div className="space-y-2"><Label htmlFor="attachment-limit">{t("general.maxAttachments")}</Label><Input id="attachment-limit" type="number" min="1" max="25" step="1" value={maxMb} onChange={(event) => setMaxMb(Number(event.target.value))} disabled={!loaded || saving} className="max-w-40" required /><p className="text-sm text-neutral-500">{t("general.appliesTo")}</p></div>
				<div className="space-y-2 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700"><p>{t("general.cloudflareLimit")}</p><p>{t("general.largeFiles")}</p></div>
				{status && <p role="status" className="text-sm text-neutral-700">{status}</p>}
				<Button type="submit" disabled={!loaded || saving || !Number.isInteger(maxMb) || maxMb < 1 || maxMb > 25}>{saving ? t("common.saving") : t("general.save")}</Button>
			</form></CardContent>
		</Card>
	</div>;
}
