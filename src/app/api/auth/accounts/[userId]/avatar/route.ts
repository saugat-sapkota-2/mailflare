import { cookies } from "next/headers";
import { getEnv } from "@/lib/cloudflare";
import { getAvatarImageResponse } from "@/lib/avatar-images";
import { ACCOUNTS_COOKIE, parseAccountTokens, resolveAccounts } from "@/lib/auth/accounts";
import { getSessionTokenFromRequestHeaders } from "@/lib/auth/session";

/** Avatar of an account signed in on this browser; other users' avatars stay private. */
export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
	const { userId } = await params;
	const env = getEnv();
	const jar = await cookies();
	const active = getSessionTokenFromRequestHeaders(request);
	const accounts = await resolveAccounts(
		env,
		Array.from(new Set(parseAccountTokens(jar.get(ACCOUNTS_COOKIE)?.value).concat(active ?? []))),
	);
	const account = accounts.find((entry) => entry.userId === userId);
	if (!account?.avatarKey) return new Response("Not found", { status: 404 });
	return getAvatarImageResponse(request, env.BUCKET, account.avatarKey);
}
