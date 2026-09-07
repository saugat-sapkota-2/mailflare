export type SetupStatus = {
	hasAdminAccount: boolean;
	hasPrimaryDomain: boolean;
	primaryDomain?: { hostname: string } | null;
	error?: string;
};

export type SetupRequirementCheck = {
	key: string;
	configured: boolean;
	message: string;
};

export type SetupPreparationResult = {
	checks?: SetupRequirementCheck[];
	migrated?: boolean;
	error?: string;
};

export type DomainSetupResult = {
	domain?: { hostname: string };
	error?: string;
};

export type RegisterResult = {
	token?: string;
	redirect?: string;
	error?: string;
};
