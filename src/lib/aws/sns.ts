import { awsQuery } from "@/lib/aws/client";
import { xmlBlocks, xmlTag } from "@/lib/aws/xml";
import type { AwsConfig } from "@/lib/aws/aws-types";

const query = (config: AwsConfig, action: string, params: Record<string, string> = {}) =>
	awsQuery(config, "sns", "2010-03-31", action, params);

export async function listTopics(config: AwsConfig): Promise<void> {
	await query(config, "ListTopics");
}

/** Idempotent: creating a topic that exists returns the same ARN. */
export async function createTopic(config: AwsConfig, name: string): Promise<string> {
	const xml = await query(config, "CreateTopic", { Name: name });
	const arn = xmlTag(xml, "TopicArn");
	if (!arn) throw new Error("SNS did not return a topic ARN");
	return arn;
}

export async function setTopicPolicy(config: AwsConfig, topicArn: string, policy: unknown): Promise<void> {
	await query(config, "SetTopicAttributes", { TopicArn: topicArn, AttributeName: "Policy", AttributeValue: JSON.stringify(policy) });
}

export async function subscribeHttps(config: AwsConfig, topicArn: string, endpoint: string): Promise<void> {
	await query(config, "Subscribe", { TopicArn: topicArn, Protocol: "https", Endpoint: endpoint, ReturnSubscriptionArn: "true" });
}

export async function listSubscriptions(config: AwsConfig, topicArn: string): Promise<{ endpoint: string; confirmed: boolean }[]> {
	const xml = await query(config, "ListSubscriptionsByTopic", { TopicArn: topicArn });
	return xmlBlocks(xml, "member").map((member) => ({
		endpoint: xmlTag(member, "Endpoint") ?? "",
		confirmed: !!xmlTag(member, "SubscriptionArn") && xmlTag(member, "SubscriptionArn") !== "PendingConfirmation",
	}));
}
