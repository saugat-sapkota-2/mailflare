export type AiUsageRow = { id: string; createdAt: string; provider: string; model: string; source: string; inputTokens: number | null; outputTokens: number | null; costUsdMicros: number | null };
export type AiUsageDaily = { date: string; requests: number; inputTokens: number; outputTokens: number };
export type AiUsageTotals = { requests: number; inputTokens: number; outputTokens: number; totalTokens: number; costUsdMicros: number; pricedRequests: number };
export type AiUsageResponse = { totals: AiUsageTotals; daily: AiUsageDaily[]; timeZone: string; rows: AiUsageRow[]; page: number; pageSize: number; totalPages: number; error?: string };
export type UsageChartProps = { daily: AiUsageDaily[]; timeZone?: string };
