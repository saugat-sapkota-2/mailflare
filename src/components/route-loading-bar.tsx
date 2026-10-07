"use client";

import { useLanguage } from "@/components/language-provider";

export function RouteLoadingBar() {
	const { t } = useLanguage();
	return (
		<div className="fixed inset-x-0 top-0 z-[120] h-1 overflow-hidden bg-blue-100" role="progressbar" aria-label={t("nav.loadingPage")}>
			<div className="route-loading-bar h-full w-2/5 bg-blue-600" />
		</div>
	);
}
