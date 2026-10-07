"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "./utils";

export function ChangePasswordForm() {
	const { t } = useLanguage();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [status, setStatus] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setStatus(null);

		if (newPassword !== confirmPassword) {
			setStatus(t("settings.password.mismatch"));
			return;
		}

		setLoading(true);
		try {
			await updatePassword(currentPassword, newPassword);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setStatus(t("settings.password.changed"));
		} catch (err) {
			setStatus(err instanceof Error ? err.message : t("settings.password.failed"));
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="currentPassword">{t("settings.password.current")}</Label>
				<Input
					id="currentPassword"
					type="password"
					autoComplete="current-password"
					value={currentPassword}
					onChange={(event) => setCurrentPassword(event.target.value)}
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="newPassword">{t("settings.password.new")}</Label>
				<Input
					id="newPassword"
					type="password"
					autoComplete="new-password"
					value={newPassword}
					onChange={(event) => setNewPassword(event.target.value)}
					minLength={8}
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="confirmPassword">{t("settings.password.confirm")}</Label>
				<Input
					id="confirmPassword"
					type="password"
					autoComplete="new-password"
					value={confirmPassword}
					onChange={(event) => setConfirmPassword(event.target.value)}
					minLength={8}
					required
				/>
			</div>
			<div className="flex items-center gap-3">
				<Button type="submit" disabled={loading}>
					{loading ? t("settings.password.changing") : t("settings.password.change")}
				</Button>
				{status && <p className="text-sm text-neutral-500">{status}</p>}
			</div>
		</form>
	);
}
