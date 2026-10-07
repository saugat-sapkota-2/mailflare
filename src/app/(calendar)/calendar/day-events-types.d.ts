import type { DragEvent, PointerEvent as ReactPointerEvent } from "react";
import type { CalendarEvent, EventResizeEdge } from "./types";

export type DayEventsProps = {
	day: Date;
	events: CalendarEvent[];
	currentTime: number;
	busy: boolean;
	activeEventId: string | null;
	onEdit: (event: CalendarEvent) => void;
	onDragStart: (dragEvent: DragEvent<HTMLButtonElement>, event: CalendarEvent) => void;
	onDragEnd: () => void;
	onResizeStart: (pointerEvent: ReactPointerEvent<HTMLButtonElement>, event: CalendarEvent, day: Date, edge: EventResizeEdge) => void;
	onResizeMove: (pointerEvent: ReactPointerEvent<HTMLButtonElement>) => void;
	onResizeEnd: (pointerEvent: ReactPointerEvent<HTMLButtonElement>) => void;
	onResizeCancel: () => void;
};
