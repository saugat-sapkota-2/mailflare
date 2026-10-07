import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export function List({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"grid gap-1 [&>*:first-child]:rounded-t-3xl [&>*:last-child]:rounded-b-3xl",
				className,
			)}
			{...props}
		/>
	);
}

export interface ListRowProps extends React.HTMLAttributes<HTMLElement> {
	asChild?: boolean;
}

export function ListRow({ className, asChild = false, ...props }: ListRowProps) {
	const Comp: React.ElementType = asChild ? Slot : "div";
	return (
		<Comp
			className={cn("flex items-center gap-4 rounded-lg bg-white p-5", className)}
			{...props}
		/>
	);
}
