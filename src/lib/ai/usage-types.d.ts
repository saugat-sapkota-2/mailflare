import type { LanguageModelUsage } from "ai";
import type { AgentModelRates } from "@/lib/agent/provider-types";

export type AiUsageDetails = { modelId: string; provider: string; rates: AgentModelRates | undefined };
export type RecordAiUsageInput = { env: CloudflareEnv; details: AiUsageDetails; usage: LanguageModelUsage; source: string };
