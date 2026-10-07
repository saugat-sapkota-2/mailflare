"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { logoutClientSession } from "@/lib/auth/logout";

export function LogoutButton() {
	const { t } = useLanguage();
	const router = useRouter();
	return (
		<Button
			variant="outline"
			className="w-full"
			onClick={async () => {
				const switched = await logoutClientSession();
				router.replace(switched ? "/inbox" : "/login");
				router.refresh();
			}}
		>
			{t("auth.logout")}
		</Button>
	);
}
