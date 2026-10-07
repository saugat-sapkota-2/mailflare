"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ManagedAccount } from "../types";
import { fetchManagedAccount } from "../utils";
import { saveAccountPassword } from "./utils";

export default function AccountPasswordPage() {
	const { t } = useLanguage();
	const { id } = useParams<{ id: string }>();
	const [account, setAccount] = useState<ManagedAccount | null>(null);
	const [password, setPassword] = useState("");
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		void fetchManagedAccount(id)
			.then(setAccount)
			.catch((error) => setMessage(error instanceof Error ? error.message : t("account.loadFailed")));
	}, [id, t]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl md:text-3xl font-medium text-neutral-900">{t("account.password.title")}</h1>
				<p className="mt-2 text-sm text-neutral-500">{t("account.password.resetFor", { name: account?.name ?? t("account.password.thisAccount") })}</p>
			</div>
			<form
				onSubmit={(event) => void saveAccountPassword({ event, account, password, setPassword, setSaving, setMessage, t })}
				className="space-y-5 rounded-3xl bg-white p-6"
			>
				{account && !account.editable ? (
					<p className="text-sm text-neutral-500">{t("account.password.onlyPrimary")}</p>
				) : (
					<>
						<div className="space-y-2">
							<Label htmlFor="account-new-password">{t("account.password.new")}</Label>
							<Input
								id="account-new-password"
								type="password"
								autoComplete="new-password"
								minLength={8}
								maxLength={128}
								required
								value={password}
								disabled={!account || saving}
								onChange={(event) => setPassword(event.target.value)}
								placeholder={t("account.password.placeholder")}
							/>
							<p className="text-xs leading-5 text-neutral-500">
								{t("account.password.hint")}
							</p>
						</div>
						<Button type="submit" disabled={!account || saving || password.trim().length < 8}>
							{saving ? t("account.password.resetting") : t("account.password.reset")}
						</Button>
					</>
				)}
			</form>
			{message && <p role="status" className="text-sm text-neutral-500">{message}</p>}
		</div>
	);
}
