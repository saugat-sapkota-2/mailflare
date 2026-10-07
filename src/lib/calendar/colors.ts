import { DEFAULT_FOLDER_COLOR, FOLDER_COLOR_VALUES } from "@/lib/folders/colors";
import type { FolderColor } from "@/lib/folders/types";

const LEGACY_CALENDAR_COLORS: Record<string, FolderColor> = {
  blue: "#2563eb",
  violet: "#7c3aed",
  rose: "#db2777",
  orange: "#ea580c",
  emerald: "#16a34a",
};

export function normalizeCalendarColor(value: string | undefined): FolderColor {
  return FOLDER_COLOR_VALUES.find((color) => color === value)
    ?? LEGACY_CALENDAR_COLORS[value ?? ""]
    ?? DEFAULT_FOLDER_COLOR;
}
