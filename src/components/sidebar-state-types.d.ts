import type { ReactNode } from "react";

export type SidebarState = {
	minimal: boolean;
	width: number;
	userId: string | null;
	toggle(): void;
	setWidth(width: number): void;
	setForcedMinimal(minimal: boolean): void;
	mobile: boolean;
	mobileOpen: boolean;
};

export type SidebarProviderProps = {
	children: ReactNode;
	expandedWidth?: number;
	mobileOverlay?: boolean;
};

export type SidebarHeaderProps = {
	href: string;
	label?: string;
};

export type SidebarScaffoldProps = {
	header: import("react").ReactNode;
	footer?: import("react").ReactNode;
	children: import("react").ReactNode;
	className?: string;
};
