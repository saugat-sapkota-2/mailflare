"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import type { AiUsageResponse } from "./types";
import { fetchAiUsage, formatEstimatedUsd, formatTokenCount, formatUsageDate, formatUsageProvider } from "./utils";
import { UsageChart } from "./usage-chart";

export default function AiUsagePage() {
	const { t } = useLanguage();
	const [data, setData] = useState<AiUsageResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loadingPage, setLoadingPage] = useState(false);

	useEffect(() => {
		let active = true;
		void fetchAiUsage(1).then((result) => { if (active) setData(result); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : t("aiUsage.loadFailed")); });
		return () => { active = false; };
	}, [t]);

	const totals = data?.totals;
	return <div className="space-y-6">
		<div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl md:text-3xl font-medium text-neutral-900">{t("aiUsage.title")}</h1><p className="mt-2 text-sm text-neutral-500">{t("aiUsage.description")}</p></div><Link href="/agent" className="shrink-0 text-sm font-medium text-blue-700 hover:underline">{t("aiUsage.back")}</Link></div>
		{error && <p role="alert" className="text-sm text-red-700">{error}</p>}
		<div className="grid gap-4 sm:grid-cols-3">
			<section className="rounded-2xl bg-white p-5"><p className="text-sm text-neutral-500">{t("aiUsage.totalTokens")}</p><p className="mt-2 text-2xl font-semibold text-neutral-900">{totals ? formatTokenCount(totals.totalTokens) : "—"}</p></section>
			<section className="rounded-2xl bg-white p-5"><p className="text-sm text-neutral-500">{t("aiUsage.totalRequests")}</p><p className="mt-2 text-2xl font-semibold text-neutral-900">{totals ? formatTokenCount(totals.requests) : "—"}</p></section>
			<section className="rounded-2xl bg-white p-5"><p className="text-sm text-neutral-500">{t("aiUsage.spend")}</p><p className="mt-2 text-2xl font-semibold text-neutral-900">{totals && totals.pricedRequests ? formatEstimatedUsd(totals.costUsdMicros) : "—"}</p>{totals && totals.pricedRequests < totals.requests && <p className="mt-1 text-xs text-neutral-500">{t("aiUsage.noRate", { count: formatTokenCount(totals.requests - totals.pricedRequests) })}</p>}</section>
		</div>
		<UsageChart daily={data?.daily ?? []} timeZone={data?.timeZone} />
		<section className="overflow-x-auto rounded-2xl bg-white" aria-busy={loadingPage}><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500"><tr><th className="px-4 py-3">{t("aiUsage.col.dateTime")}</th><th className="px-4 py-3">{t("aiUsage.col.model")}</th><th className="px-4 py-3">{t("aiUsage.col.provider")}</th><th className="px-4 py-3 text-right">{t("aiUsage.col.input")}</th><th className="px-4 py-3 text-right">{t("aiUsage.col.output")}</th><th className="px-4 py-3 text-right">{t("aiUsage.col.spending")}</th></tr></thead><tbody className="divide-y divide-neutral-100">{data?.rows.map((row) => <tr key={row.id}><td className="whitespace-nowrap px-4 py-3 text-neutral-600">{formatUsageDate(row.createdAt)}</td><td className="max-w-56 break-all px-4 py-3">{row.model}</td><td className="px-4 py-3">{formatUsageProvider(row.provider)}</td><td className="px-4 py-3 text-right tabular-nums">{formatTokenCount(row.inputTokens)}</td><td className="px-4 py-3 text-right tabular-nums">{formatTokenCount(row.outputTokens)}</td><td className="px-4 py-3 text-right tabular-nums">{formatEstimatedUsd(row.costUsdMicros)}</td></tr>)}{data && data.rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-500">{t("aiUsage.none")}</td></tr>}{!data && !error && <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-500">{t("aiUsage.loading")}</td></tr>}</tbody></table></section>
		{data && <div className="flex items-center justify-end gap-3 text-sm text-neutral-600"><span>{t("aiUsage.pageOf", { page: data.page, total: data.totalPages, size: data.pageSize })}</span><Button type="button" variant="outline" size="sm" disabled={loadingPage || data.page <= 1} onClick={() => { setLoadingPage(true); setError(null); void fetchAiUsage(data.page - 1).then(setData).catch((cause) => setError(cause instanceof Error ? cause.message : t("aiUsage.pageFailed"))).finally(() => setLoadingPage(false)); }}>{t("aiUsage.previous")}</Button><Button type="button" variant="outline" size="sm" disabled={loadingPage || data.page >= data.totalPages} onClick={() => { setLoadingPage(true); setError(null); void fetchAiUsage(data.page + 1).then(setData).catch((cause) => setError(cause instanceof Error ? cause.message : t("aiUsage.pageFailed"))).finally(() => setLoadingPage(false)); }}>{t("aiUsage.next")}</Button></div>}
		<p className="text-xs text-neutral-500">{t("aiUsage.note")}</p>
	</div>;
}
