"use client";

import { useLanguage } from "@/components/language-provider";

import { Skeleton } from "@/components/ui/skeleton";

export function ConversationSkeleton() {
	const { t } = useLanguage();
	return <div role="status" aria-label={t("agent.loadingConversation")} className="space-y-6 py-2">
		<div className="flex justify-end"><Skeleton className="h-12 w-3/5 max-w-72 rounded-2xl bg-blue-100/65" /></div>
		<div className="space-y-3">
			<Skeleton className="h-3 w-24" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-11/12" />
			<Skeleton className="h-4 w-3/4" />
		</div>
		<div className="flex justify-end"><Skeleton className="h-12 w-1/2 max-w-60 rounded-2xl bg-blue-100/65" /></div>
		<div className="space-y-3">
			<Skeleton className="h-3 w-24" />
			<Skeleton className="h-4 w-5/6" />
			<Skeleton className="h-4 w-2/3" />
		</div>
	</div>;
}
