import { Skeleton } from "@/components/ui/skeleton";

export default function DomainDnsSkeleton() {
	return (
		<div className="space-y-3 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
			<Skeleton className="h-4 w-28" />
			<Skeleton className="h-3 w-96 max-w-full" />
			<div className="space-y-2">
				{Array.from({ length: 4 }, (_, index) => (
					<Skeleton key={index} className="h-16 w-full rounded-xl" />
				))}
			</div>
		</div>
	);
}
