import { updateTrashRetentionSettingsSchema } from "@/lib/validators";
import type { UpdateTrashRetentionSettingsInput } from "./types";

export async function parseUpdateTrashRetentionSettingsRequest(request: Request): Promise<UpdateTrashRetentionSettingsInput> {
	return updateTrashRetentionSettingsSchema.parse(await request.json());
}
