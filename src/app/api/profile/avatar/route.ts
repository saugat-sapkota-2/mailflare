import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { deleteAvatarImages, getAvatarImageResponse, getOptimizedAvatarFiles, storeAvatarImages } from "@/lib/avatar-images";
import { syncPersonalIdentity } from "@/lib/profile/sync";
import { avatarKeyFor } from "./utils";

export async function GET(request: Request) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return new Response("Unauthorized", { status: 401 });
	if (!user.avatarKey) return new Response("Not found", { status: 404 });

	return getAvatarImageResponse(request, env.BUCKET, user.avatarKey);
}

export async function POST(request: Request) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
	}
	const images = getOptimizedAvatarFiles(form);
	if (!images) return NextResponse.json({ error: "A resized WebP image and preview are required" }, { status: 400 });

	const key = avatarKeyFor(user.id);
	await storeAvatarImages(env.BUCKET, key, images.full, images.preview);
	await syncPersonalIdentity(getDb(env), {
		userId: user.id,
		name: user.name,
		avatarKey: key,
	});

	return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
	const env = getEnv();
	const user = await getCurrentUser(env, request);
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	if (user.avatarKey) {
		await deleteAvatarImages(env.BUCKET, user.avatarKey);
	}
	await syncPersonalIdentity(getDb(env), {
		userId: user.id,
		name: user.name,
		avatarKey: null,
	});
	return NextResponse.json({ ok: true });
}
