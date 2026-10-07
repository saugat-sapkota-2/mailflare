import { authFetch } from "@/lib/auth/client";

type RecipientAddressSettingsResponse = {
	enabled?: boolean;
	error?: string;
};

async function readEnabled(response: Response, fallback: string): Promise<boolean> {
	const data = (await response.json()) as RecipientAddressSettingsResponse;
	if (!response.ok || typeof data.enabled !== "boolean") {
		throw new Error(typeof data.error === "string" ? data.error : fallback);
	}
	return data.enabled;
}

export async function loadShowFullRecipientAddresses(): Promise<boolean> {
	const response = await authFetch("/api/settings/recipient-addresses");
	return readEnabled(response, "Failed to load recipient address settings");
}

export async function updateShowFullRecipientAddresses(enabled: boolean): Promise<boolean> {
	const response = await authFetch("/api/settings/recipient-addresses", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ enabled }),
	});
	return readEnabled(response, "Failed to update recipient address settings");
}
