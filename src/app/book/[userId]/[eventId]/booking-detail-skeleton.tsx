"use client";

import { useLanguage } from "@/components/language-provider";

export function BookingDetailSkeleton() {
	const { t } = useLanguage();
	return <div role="status" aria-label={t("public.loadingAvailability")} className="grid overflow-hidden rounded-t-3xl bg-white shadow-xl shadow-neutral-200/50 motion-safe:animate-pulse lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(240px,.95fr)_minmax(380px,1.65fr)_minmax(240px,.95fr)]">
		<span className="sr-only">{t("public.loadingAvailabilityEllipsis")}</span>
		<div className="space-y-6 border-b border-neutral-200 p-7 sm:p-9 lg:border-b-0 lg:border-r">
			<div className="h-6 w-2/3 rounded bg-neutral-200" />
			<div className="h-4 w-full rounded bg-neutral-100" />
			<div className="h-4 w-4/5 rounded bg-neutral-100" />
			<div className="mt-10 h-4 w-1/3 rounded bg-neutral-100" />
		</div>
		<div className="border-b border-neutral-200 p-7 sm:p-9 lg:border-b-0 lg:border-r">
			<div className="h-6 w-1/2 rounded bg-neutral-200" />
			<div className="mx-auto mt-10 grid max-w-[440px] grid-cols-7 gap-2">
				{Array.from({ length: 35 }, (_, index) => <div key={index} className="aspect-square rounded-lg bg-neutral-100" />)}
			</div>
		</div>
		<div className="space-y-3 p-7 sm:p-9">
			<div className="mb-6 h-6 w-3/4 rounded bg-neutral-200" />
			{[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-11 rounded-md bg-neutral-100" />)}
		</div>
	</div>;
}
