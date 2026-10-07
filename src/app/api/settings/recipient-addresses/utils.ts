import { updateRecipientAddressSettingsSchema } from "@/lib/validators";
import type { UpdateRecipientAddressSettingsInput } from "./types";

export async function parseUpdateRecipientAddressSettingsRequest(
	request: Request,
): Promise<UpdateRecipientAddressSettingsInput> {
	return updateRecipientAddressSettingsSchema.parse(await request.json());
}
