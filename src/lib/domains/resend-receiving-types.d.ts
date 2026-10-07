import type { ReceivingStep } from "@/lib/aws/ses-receiving-types";

export type ResendReceivingView = {
	steps: ReceivingStep[];
	ready: boolean;
	mx: string | null;
	dnsManaged: boolean;
	/** The key cannot manage domains or webhooks, so setup has to happen in the Resend dashboard. */
	restrictedKey: boolean;
};
