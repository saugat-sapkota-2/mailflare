import type { MigrationResult, MigrationStatus } from "@/lib/migrations/types";

export interface MigrationStatusResponse extends MigrationStatus {
	error?: string;
}

export interface MigrationApplyResponse extends MigrationResult {
	error?: string;
}
