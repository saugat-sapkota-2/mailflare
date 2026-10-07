import type { LanguageModelUsage } from "ai";
import type { AgentModelRates } from "./provider-types";

export function parseAgentModelRates(value: string | null): Record<string, AgentModelRates> {
	if (!value) return {};
	try {
		const parsed: unknown = JSON.parse(value);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
		return Object.fromEntries(Object.entries(parsed).flatMap(([model, rates]) => {
			if (!rates || typeof rates !== "object" || Array.isArray(rates)) return [];
			const input = "input" in rates ? rates.input : null;
			const output = "output" in rates ? rates.output : null;
			return [[model, { input: typeof input === "number" && Number.isFinite(input) && input >= 0 ? input : null, output: typeof output === "number" && Number.isFinite(output) && output >= 0 ? output : null }]];
		}));
	} catch { return {}; }
}

export function calculateAgentCostUsdMicros(usage: LanguageModelUsage, rates: AgentModelRates | undefined): number | null {
	if (!rates || rates.input === null || rates.output === null || usage.inputTokens === undefined || usage.outputTokens === undefined) return null;
	return Math.round(usage.inputTokens * rates.input + usage.outputTokens * rates.output);
}
