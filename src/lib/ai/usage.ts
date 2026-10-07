import { getDb } from "@/db";
import { aiUsage } from "@/db/schema";
import { newId } from "@/lib/ids";
import { calculateAgentCostUsdMicros } from "@/lib/agent/pricing";
import type { RecordAiUsageInput } from "./usage-types";

export async function recordAiUsage({ env, details, usage, source }: RecordAiUsageInput) {
	try {
		await getDb(env).insert(aiUsage).values({
			id: newId("usage"),
			provider: details.provider,
			model: details.modelId,
			source,
			inputTokens: usage.inputTokens ?? null,
			outputTokens: usage.outputTokens ?? null,
			costUsdMicros: calculateAgentCostUsdMicros(usage, details.rates),
		});
	} catch (error) {
		console.error("Could not record AI usage", error);
	}
}
