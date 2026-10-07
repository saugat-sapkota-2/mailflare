import { and, desc, gte, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { aiUsage } from "@/db/schema";
import { getEnv } from "@/lib/cloudflare";
import { requireSessionUser } from "@/lib/api/auth";
import { isPrimaryAdmin } from "@/lib/auth/admin";
import { getRequestTimeZone, recentZonedDays } from "@/lib/time/utils";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
	const env = getEnv();
	const session = await requireSessionUser(env, request);
	if (session.error) return session.error;
	if (!isPrimaryAdmin(session.user)) return Response.json({ error: "Forbidden" }, { status: 403 });
	const rawPage = new URL(request.url).searchParams.get("page") ?? "1";
	const page = Number(rawPage);
	if (!Number.isSafeInteger(page) || page < 1 || page > Math.floor(Number.MAX_SAFE_INTEGER / PAGE_SIZE)) return Response.json({ error: "Invalid page" }, { status: 400 });
	const db = getDb(env);
	const [totals] = await db.select({
		requests: sql<number>`count(*)`,
		inputTokens: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)`,
		outputTokens: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)`,
		costUsdMicros: sql<number>`coalesce(sum(${aiUsage.costUsdMicros}), 0)`,
		pricedRequests: sql<number>`count(${aiUsage.costUsdMicros})`,
	}).from(aiUsage);
	const timeZone = getRequestTimeZone(request, session.user.timeZone);
	const days = recentZonedDays(timeZone, 30);
	// Each boundary uses the offset on that date, including daylight-saving changes.
	const day = sql<string>`CASE ${sql.join(days.map((item) => sql`WHEN ${aiUsage.createdAt} < ${item.end.getTime() / 1000} THEN ${item.date}`), sql` `)} END`;
	const dailyRows = await db.select({
		date: day.as("date"),
		requests: sql<number>`count(*)`,
		inputTokens: sql<number>`coalesce(sum(${aiUsage.inputTokens}), 0)`,
		outputTokens: sql<number>`coalesce(sum(${aiUsage.outputTokens}), 0)`,
	}).from(aiUsage).where(and(gte(aiUsage.createdAt, days[0].start), lt(aiUsage.createdAt, days[days.length - 1].end))).groupBy(sql`"date"`).orderBy(sql`"date"`);
	const byDate = new Map(dailyRows.map((row) => [row.date, row]));
	const daily = days.map(({ date }) => byDate.get(date) ?? { date, requests: 0, inputTokens: 0, outputTokens: 0 });
	const rows = await db.select().from(aiUsage).orderBy(desc(aiUsage.createdAt), desc(aiUsage.id)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
	return Response.json({ totals: { ...totals, totalTokens: totals.inputTokens + totals.outputTokens }, daily, timeZone, rows, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(totals.requests / PAGE_SIZE)) }, { headers: { "Cache-Control": "no-store" } });
}
