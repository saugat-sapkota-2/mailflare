import type { SidebarScaffoldProps } from "./sidebar-state-types";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-state";

// Header and footer stay put; only the middle scrolls. The padding inside the scroller
// matches the mask's fade length, so nothing looks faded until content actually scrolls under it.
export function SidebarScaffold({ header, footer, children, className }: SidebarScaffoldProps) {
	const { minimal } = useSidebar();
	return (
		<nav className={cn("flex h-full min-h-0 flex-col", className)}>
			<div className="shrink-0 px-3 pt-4">{header}</div>
			<div className={cn("flex min-h-0 flex-1 flex-col gap-px overflow-y-auto [&>*]:shrink-0 overscroll-contain py-3", minimal ? "px-3" : "pr-3", "[scrollbar-gutter:stable] [mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-12px),transparent)]")}>
				{children}
			</div>
			{footer && <div className="shrink-0 px-3 pb-3">{footer}</div>}
		</nav>
	);
}
