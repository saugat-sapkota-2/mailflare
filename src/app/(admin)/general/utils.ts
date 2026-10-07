import { authFetch } from "@/lib/auth/client";
import type { GeneralSettings } from "./types";

export async function loadGeneralSettings(): Promise<GeneralSettings> {
	const response = await authFetch("/api/admin/general", { cache: "no-store" });
	const data = await response.json();
	if (!response.ok) throw new Error(data.error ?? "Could not load general settings");
	return data as GeneralSettings;
}

export async function saveGeneralSettings(outboundAttachmentMaxMb: number): Promise<GeneralSettings> {
	const response = await authFetch("/api/admin/general", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ outboundAttachmentMaxMb }),
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.error ?? "Could not save general settings");
	return data as GeneralSettings;
}
