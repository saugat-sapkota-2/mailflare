"use client";

import { useLanguage } from "@/components/language-provider";
import { Switch } from "@/components/ui/switch";
import { useTwoColumnReading } from "@/components/messages/use-two-column-reading";

export function InboxReadingLayoutSettings() {
	const { t } = useLanguage();
	const [twoColumnReading, setTwoColumnReading] = useTwoColumnReading();

	return (
		<label className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
			<span className="flex-1">
				<span className="block text-sm font-medium text-neutral-900">{t("settings.reading.title")}</span>
				<span className="mt-1 block text-sm text-neutral-500">
					{t("settings.reading.description")}
				</span>
			</span>
			<Switch checked={twoColumnReading} onCheckedChange={setTwoColumnReading} aria-label={t("settings.reading.title")} />
		</label>
	);
}
