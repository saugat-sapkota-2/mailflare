"use client";

import { useRouter } from "next/navigation";
import { SidebarHeader } from "@/components/sidebar-header";
import { useSidebar } from "@/components/sidebar-state";
import { UpcomingSidebar } from "./upcoming-sidebar";

// Phone menu for the calendar section: the upcoming events list, as the desktop left column shows.
// Stays mounted while the menu is closed so the loaded list is still there next time it opens;
// opening refreshes it in the background.
export function CalendarMobileUpcoming() {
	const { mobile, mobileOpen, toggle } = useSidebar();
	const router = useRouter();
	if (!mobile) return null;
	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="shrink-0 px-3 pt-4"><SidebarHeader href="/inbox" /></div>
			<div className="min-h-0 flex-1">
				<UpcomingSidebar drawer refreshKey={mobileOpen} onSelect={(event) => {
					toggle();
					router.push(`/calendar?event=${encodeURIComponent(event.id)}`);
				}} />
			</div>
		</div>
	);
}
