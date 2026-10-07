import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { requireAwsConfig, SES_RECEIVING_REGIONS } from "@/lib/aws/config";
import { AwsError } from "@/lib/aws/client";
import { activateRuleSet, createRuleSet, deleteReceiptRule, describeActiveRuleSet, describeReceiptRule, upsertReceiptRule } from "@/lib/aws/ses";
import { bucketExists, createBucket, putBucketPolicy, putExpiryLifecycle } from "@/lib/aws/s3";
import { createTopic, listSubscriptions, setTopicPolicy, subscribeHttps } from "@/lib/aws/sns";
import { getCallerIdentity } from "@/lib/aws/sts";
import { hasMx, isInboundSmtpMx, publishMx, removeMx } from "@/lib/domains/receiving-dns";
import { isManualZone } from "@/lib/domains/provision";
import type { SesReceivingState } from "@/lib/aws/aws-types";
import type { ReceivingStep, SesReceivingView } from "@/lib/aws/ses-receiving-types";
import type { DomainRow } from "@/lib/domains/types";

export const SES_OBJECT_PREFIX = "inbound/";
const RULE_SET = "mailflare-inbound";
const TOPIC_NAME = "mailflare-inbound";

export const sesInboundMx = (region: string) => `inbound-smtp.${region}.amazonaws.com`;
const ruleName = (hostname: string) => `mailflare-${hostname.replace(/[^a-zA-Z0-9-_]/g, "-")}`.slice(0, 64);

export async function getSesReceivingState(env: CloudflareEnv): Promise<SesReceivingState | null> {
	const [row] = await getDb(env).select({ value: appSettings.sesReceiving }).from(appSettings).where(eq(appSettings.id, "default")).limit(1);
	if (!row?.value) return null;
	try { return JSON.parse(row.value) as SesReceivingState; } catch { return null; }
}

async function saveState(env: CloudflareEnv, state: SesReceivingState): Promise<void> {
	const values = { sesReceiving: JSON.stringify(state), updatedAt: new Date() };
	await getDb(env).insert(appSettings).values({ id: "default", ...values }).onConflictDoUpdate({ target: appSettings.id, set: values });
}

function isPublicHttps(origin: string): boolean {
	try {
		const url = new URL(origin);
		return url.protocol === "https:" && !/^(localhost|127\.|\[::1\]|.*\.localhost$|.*\.test$)/.test(url.hostname);
	} catch { return false; }
}

/**
 * Creates what SES needs to hand Mailflare a message: an S3 bucket SES may write
 * to, an SNS topic SES may publish to (subscribed to this app's signed endpoint),
 * and a receipt rule for the domain, then points the domain's MX at SES.
 * Everything is idempotent, so running it again repairs a partial setup.
 */
export async function setupSesReceiving(
	env: CloudflareEnv,
	domain: DomainRow,
	origin: string,
	options: { replaceMx: boolean },
): Promise<void> {
	const config = await requireAwsConfig(env);
	if (!SES_RECEIVING_REGIONS.includes(config.region)) {
		throw new Error(`Amazon SES cannot receive mail in ${config.region}. Use a region such as us-east-1, us-west-2 or eu-west-1.`);
	}
	if (!isPublicHttps(origin)) {
		throw new Error("SES delivers mail by calling this app over public HTTPS. Set APP_URL to your public address (localhost will not work).");
	}
	const { accountId } = await getCallerIdentity(config);
	const previous = await getSesReceivingState(env);
	const state: SesReceivingState = {
		region: config.region,
		accountId,
		bucket: `mailflare-inbound-${accountId}-${config.region}`,
		topicArn: "",
		ruleSet: previous?.ruleSet ?? RULE_SET,
		token: previous?.token ?? crypto.randomUUID().replace(/-/g, ""),
		endpoint: `${origin.replace(/\/$/, "")}/api/inbound/ses?token=`,
	};
	state.endpoint += state.token;

	await createBucket(config, state.bucket);
	await putBucketPolicy(config, state.bucket, {
		Version: "2012-10-17",
		Statement: [{
			Sid: "AllowSESPuts",
			Effect: "Allow",
			Principal: { Service: "ses.amazonaws.com" },
			Action: "s3:PutObject",
			Resource: `arn:aws:s3:::${state.bucket}/*`,
			Condition: { StringEquals: { "aws:Referer": accountId } },
		}],
	});
	await putExpiryLifecycle(config, state.bucket, SES_OBJECT_PREFIX, 1).catch(() => undefined);

	state.topicArn = await createTopic(config, TOPIC_NAME);
	await setTopicPolicy(config, state.topicArn, {
		Version: "2008-10-17",
		Statement: [
			{
				Sid: "AllowOwner",
				Effect: "Allow",
				Principal: { AWS: "*" },
				Action: ["SNS:GetTopicAttributes", "SNS:SetTopicAttributes", "SNS:AddPermission", "SNS:RemovePermission", "SNS:DeleteTopic", "SNS:Subscribe", "SNS:ListSubscriptionsByTopic", "SNS:Publish"],
				Resource: state.topicArn,
				Condition: { StringEquals: { "AWS:SourceOwner": accountId } },
			},
			{
				Sid: "AllowSESPublish",
				Effect: "Allow",
				Principal: { Service: "ses.amazonaws.com" },
				Action: "SNS:Publish",
				Resource: state.topicArn,
				Condition: { StringEquals: { "AWS:SourceAccount": accountId } },
			},
		],
	});
	const subscriptions = await listSubscriptions(config, state.topicArn);
	if (!subscriptions.some((subscription) => subscription.endpoint === state.endpoint)) {
		await subscribeHttps(config, state.topicArn, state.endpoint);
	}

	// Only one rule set is active per region. Use the account's own if it has one
	// (adding our rule beside theirs); otherwise create and activate ours.
	const active = await describeActiveRuleSet(config);
	if (active.name) state.ruleSet = active.name;
	else {
		await createRuleSet(config, state.ruleSet);
		await activateRuleSet(config, state.ruleSet);
	}
	await upsertReceiptRule(config, {
		ruleSet: state.ruleSet,
		name: ruleName(domain.hostname),
		recipient: domain.hostname,
		bucket: state.bucket,
		prefix: SES_OBJECT_PREFIX,
		topicArn: state.topicArn,
	});
	await saveState(env, state);

	await publishMx(env, domain, sesInboundMx(config.region), { replace: options.replaceMx });
}

export async function getSesReceivingView(env: CloudflareEnv, domain: DomainRow): Promise<SesReceivingView> {
	const config = await requireAwsConfig(env);
	const state = await getSesReceivingState(env);
	const mx = sesInboundMx(config.region);
	const steps: ReceivingStep[] = [];
	const regionOk = SES_RECEIVING_REGIONS.includes(config.region);
	steps.push({ key: "region", label: "Region supports receiving", ok: regionOk, detail: regionOk ? config.region : `${config.region} cannot receive mail` });

	const attempt = async (run: () => Promise<boolean>): Promise<boolean> => {
		try { return await run(); } catch (error) { if (error instanceof AwsError) return false; throw error; }
	};
	const bucketOk = !!state && await attempt(() => bucketExists(config, state.bucket));
	steps.push({ key: "bucket", label: "S3 bucket for raw mail", ok: bucketOk, detail: state?.bucket });
	const subscribed = !!state && await attempt(async () => (await listSubscriptions(config, state.topicArn)).some((subscription) => subscription.endpoint === state.endpoint && subscription.confirmed));
	steps.push({ key: "topic", label: "SNS topic delivering to Mailflare", ok: subscribed, detail: state && !subscribed ? "Subscription not confirmed yet" : undefined });
	const ruleOk = !!state && await attempt(() => describeReceiptRule(config, state.ruleSet, ruleName(domain.hostname)));
	steps.push({ key: "rule", label: "SES receipt rule for this domain", ok: ruleOk, detail: ruleOk ? state?.ruleSet : undefined });
	const mxOk = await hasMx(env, domain, mx);
	steps.push({ key: "mx", label: "MX record points to SES", ok: mxOk === true, detail: mxOk === null ? "Add the MX record in your DNS" : mx });

	return { steps, ready: steps.every((step) => step.ok), region: config.region, mx, dnsManaged: !isManualZone(domain.zoneId) };
}

/** Removes this domain's rule and MX. The shared bucket and topic stay for other domains. */
export async function removeSesReceiving(env: CloudflareEnv, domain: DomainRow): Promise<void> {
	const config = await requireAwsConfig(env);
	const state = await getSesReceivingState(env);
	if (state) await deleteReceiptRule(config, state.ruleSet, ruleName(domain.hostname));
	await removeMx(env, domain, isInboundSmtpMx);
}

export async function hasSesReceivingConfig(env: CloudflareEnv, domain: DomainRow): Promise<boolean | null> {
	try {
		const config = await requireAwsConfig(env);
		const state = await getSesReceivingState(env);
		if (!state) return false;
		return await describeReceiptRule(config, state.ruleSet, ruleName(domain.hostname));
	} catch { return null; }
}
