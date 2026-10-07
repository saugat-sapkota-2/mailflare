import type { ReactNode } from "react";

export type ReorderableItem = {
	id: string;
	node: ReactNode;
};

export type ReorderableListSpec = {
	id: string;
	items: ReorderableItem[];
	/** Row rendered above this list (e.g. a "More..." toggle). Dropping on it moves items between this list and the previous one. */
	before?: ReactNode;
	/** Items stay in the layout but are not rendered (a collapsed section). */
	hidden?: boolean;
	/** Narrows the ordered ids down to the ones to render. */
	visibleIds?: (orderedIds: string[]) => string[];
};

export type ReorderableListProps = {
	lists: ReorderableListSpec[];
	/** localStorage key for the saved layout. */
	storageKey: string;
	/** Hold-to-reorder is switched off when false (e.g. the collapsed icon rail). */
	enabled?: boolean;
};

export type ReorderableLayout = Record<string, string[]>;

export type ReorderableDropTarget = {
	listId: string;
	/** Insert before this id; null appends to the list. */
	beforeId: string | null;
	/** Viewport y of the indicator line. */
	lineY: number;
};

export type ReorderableDrag = {
	id: string;
	left: number;
	width: number;
	height: number;
	offsetY: number;
	/** Horizontal extent of the list, for the drop indicator. */
	listLeft: number;
	listWidth: number;
	pointerY: number;
};
