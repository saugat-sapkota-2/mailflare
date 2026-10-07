"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Search, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { Input } from "@/components/ui/input";
import { useMailSearch } from "./mail-search-context";
import { useShortcuts } from "@/components/shortcuts";

export function MailSearchInput() {
	const { t } = useLanguage();
	const { input: query, setQuery } = useMailSearch();
	const { openCommandPalette, shortcutsEnabled, shortcutsPreferenceLoading } = useShortcuts();
	const showShortcutHints = shortcutsEnabled && !shortcutsPreferenceLoading;
	// On phones the field is an icon until tapped, then covers the header at full width.
	const [expanded, setExpanded] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (expanded) inputRef.current?.focus();
	}, [expanded]);

	return (
		<>
		<button
			type="button"
			onClick={() => setExpanded(true)}
			aria-label={t("search.mail")}
			className={clsx("ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-neutral-200 md:hidden", query ? "bg-blue-100 text-blue-700" : "text-neutral-600", expanded && "hidden")}
		>
			<Search className="h-5 w-5" />
		</button>
		<div className={clsx("h-12 flex-1 items-center gap-2.5 rounded-full bg-[#eaf1fb] px-4 text-neutral-600 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all md:flex", expanded ? "flex max-md:fixed max-md:inset-x-2 max-md:top-2 max-md:z-[60] max-md:shadow-md" : "max-md:hidden")}>
			<Search className="h-5 w-5 shrink-0" />
			<Input
				ref={inputRef}
				data-mail-search-input=""
				onBlur={() => setExpanded(false)}
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				placeholder={showShortcutHints ? t("search.mailHint") : t("search.mail")}
				className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-neutral-800 outline-none! shadow-none! border-none! placeholder:text-neutral-500"
			/>
			{query ? (
				<button
					type="button"
					onMouseDown={(event) => event.preventDefault()}
					onClick={() => setQuery("")}
					className="rounded-full p-1 text-neutral-500 hover:bg-blue-100 hover:text-neutral-800"
					aria-label={t("search.clear")}
				>
					<X className="h-4 w-4" />
				</button>
			) : showShortcutHints ? (
				<button
					type="button"
					onClick={openCommandPalette}
					className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-neutral-500 bg-white/70 hover:bg-white border border-neutral-200/80 rounded-md shadow-2xs transition-colors"
					title={t("search.openPalette")}
				>
					<span className="text-[11px] font-mono">⌘K</span>
				</button>
			) : null}
		</div>
		</>
	);
}
