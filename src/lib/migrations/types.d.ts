export interface BundledMigration {
	name: string;
	statements: string[];
}

export interface MigrationStatus {
	ready: boolean;
	pending: string[];
	unknown: string[];
}

export interface MigrationResult extends MigrationStatus {
	applied: string[];
}

export interface MigrationNameRow {
	name: string;
}
