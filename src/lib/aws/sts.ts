import { awsQuery } from "@/lib/aws/client";
import { xmlTag } from "@/lib/aws/xml";
import type { AwsConfig } from "@/lib/aws/aws-types";

/** Proves the credentials are real and says whose they are. */
export async function getCallerIdentity(config: AwsConfig): Promise<{ accountId: string; arn: string }> {
	const xml = await awsQuery(config, "sts", "2011-06-15", "GetCallerIdentity");
	return { accountId: xmlTag(xml, "Account") ?? "", arn: xmlTag(xml, "Arn") ?? "" };
}
