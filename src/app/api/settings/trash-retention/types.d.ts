import type { updateTrashRetentionSettingsSchema } from "@/lib/validators";
import type { z } from "zod";

export type UpdateTrashRetentionSettingsInput = z.infer<typeof updateTrashRetentionSettingsSchema>;

export type TrashRetentionSettingsResponse = {
	days?: number | null;
	error?: unknown;
};
