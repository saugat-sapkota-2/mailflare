import { getServerTranslator } from "@/lib/i18n/server";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { MfaSettings } from "@/components/settings/mfa-settings";

export default async function SecuritySettingsPage() {
	const t = await getServerTranslator();
	return <div className="space-y-8 py-4">
		<section className="space-y-4">
			<div>
				<h1 className="text-xl font-semibold text-neutral-900">{t("settingsPage.security.title")}</h1>
				<p className="mt-1 text-sm text-neutral-500">{t("settingsPage.security.description")}</p>
			</div>
			<div className="space-y-4 rounded-3xl bg-white p-6">
				<div>
					<h2 className="text-lg font-semibold text-neutral-900">{t("settingsPage.security.changePassword")}</h2>
					<p className="mt-1 text-sm text-neutral-500">{t("settingsPage.security.changePasswordDescription")}</p>
				</div>
				<ChangePasswordForm />
			</div>
			<div className="space-y-4 rounded-3xl bg-white p-6">
				<div>
					<h2 className="text-lg font-semibold text-neutral-900">{t("settingsPage.security.mfa")}</h2>
					<p className="mt-1 text-sm text-neutral-500">{t("settingsPage.security.mfaDescription")}</p>
				</div>
				<MfaSettings />
			</div>
		</section>
	</div>;
}
