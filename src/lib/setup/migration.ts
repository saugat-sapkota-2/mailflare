import { applyPendingMigrations } from "@/lib/migrations/service";

export async function migrateCleanDatabase(db: D1Database): Promise<boolean> {
	const result = await applyPendingMigrations(db);
	return result.applied.length > 0;
}
