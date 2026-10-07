import { z } from "zod";
import { isValidTimeZone, normalizeTimeZone } from "@/lib/time/utils";
import type { UpdateTimeZoneInput } from "./types";

const updateTimeZoneSchema = z.object({
	timeZone: z.string().trim().min(1).max(80).refine(isValidTimeZone, "Choose a valid IANA timezone").nullable(),
});

export async function parseTimeZoneUpdate(request: Request): Promise<UpdateTimeZoneInput | null> {
	const body = await request.json().catch(() => null);
	const parsed = updateTimeZoneSchema.safeParse(body);
	return parsed.success ? { timeZone: parsed.data.timeZone ? normalizeTimeZone(parsed.data.timeZone) : null } : null;
}
