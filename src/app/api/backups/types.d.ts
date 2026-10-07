import type { BackupScheduleType, BackupTableGroupId } from "@/lib/backups/types";

export type BackupSettingsInput = {
	enabled: boolean;
	scheduleType: BackupScheduleType;
	scheduleValue: number | null;
	retentionEnabled: boolean;
	retentionDays: number;
	excludedTableGroups: BackupTableGroupId[];
};
