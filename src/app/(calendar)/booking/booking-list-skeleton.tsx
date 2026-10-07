"use client";

import { useLanguage } from "@/components/language-provider";

export function BookingListSkeleton() {
	const { t } = useLanguage();
	return <div role="status" aria-label={t("booking.loading")} className="space-y-3">
		<span className="sr-only">{t("booking.loadingEllipsis")}</span>
		{[0, 1, 2].map((item) => <div key={item} className="rounded-2xl border border-neutral-200 bg-white px-5 py-5 motion-safe:animate-pulse">
			<div className="h-5 w-1/2 rounded bg-neutral-200" />
			<div className="mt-4 h-3 w-3/4 rounded bg-neutral-100" />
			<div className="mt-3 h-3 w-2/5 rounded bg-neutral-100" />
		</div>)}
	</div>;
}
