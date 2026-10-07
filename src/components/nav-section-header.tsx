"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { readStorage, writeStorage } from "./reorderable-list-utils";

/** Open/closed state of a menu section, remembered in localStorage. Starts open. */
export function useSectionOpen(storageKey: string): [boolean, () => void] {
	const [open, setOpen] = useState(true);
	useEffect(() => { setOpen(readStorage(storageKey, true)); }, [storageKey]);
	function toggle() {
		writeStorage(storageKey, !open);
		setOpen(!open);
	}
	return [open, toggle];
}

export function NavSectionHeader({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children?: ReactNode }) {
	return (
		<div className="mt-2 flex h-8 shrink-0 items-center justify-between px-6">
			<button type="button" onClick={onToggle} aria-expanded={open} className="flex items-center gap-1 text-sm font-medium tracking-wide text-neutral-900 max-md:text-base">
				{label}
				<ChevronDown className={cn("h-4 w-4 text-neutral-500 transition-transform", !open && "-rotate-90")} />
			</button>
			{children}
		</div>
	);
}
