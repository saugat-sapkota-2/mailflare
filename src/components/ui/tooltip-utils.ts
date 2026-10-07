import type { TooltipPosition, TooltipProps } from "./tooltip-types";

const TOOLTIP_GAP = 8;
const VIEWPORT_PADDING = 8;

export function getTooltipPosition(
	trigger: HTMLElement,
	tooltip: HTMLElement,
	placement: TooltipProps["placement"] = "auto",
): TooltipPosition {
	const triggerRect = trigger.getBoundingClientRect();
	const tooltipRect = tooltip.getBoundingClientRect();
	if (placement === "right") {
		return {
			left: Math.min(triggerRect.right + TOOLTIP_GAP, window.innerWidth - tooltipRect.width - VIEWPORT_PADDING),
			top: Math.min(
				Math.max(triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2, VIEWPORT_PADDING),
				window.innerHeight - tooltipRect.height - VIEWPORT_PADDING,
			),
		};
	}
	const centeredLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
	const left = Math.min(
		Math.max(centeredLeft, VIEWPORT_PADDING),
		window.innerWidth - tooltipRect.width - VIEWPORT_PADDING,
	);
	const fitsBelow =
		window.innerHeight - triggerRect.bottom >= tooltipRect.height + TOOLTIP_GAP;
	const top = fitsBelow
		? triggerRect.bottom + TOOLTIP_GAP
		: triggerRect.top - tooltipRect.height - TOOLTIP_GAP;

	return {
		left,
		top: Math.max(VIEWPORT_PADDING, top),
	};
}
