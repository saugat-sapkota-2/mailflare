import type { updateRecipientAddressSettingsSchema } from "@/lib/validators";
import type { z } from "zod";

export type UpdateRecipientAddressSettingsInput = z.infer<typeof updateRecipientAddressSettingsSchema>;
