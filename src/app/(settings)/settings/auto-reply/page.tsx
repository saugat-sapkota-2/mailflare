import { MailboxAutoReplyForm } from "@/components/settings/mailbox-auto-reply-form";

export default function SettingsAutoReplyPage() {
	return (
		<div className="space-y-8 py-4">
			{/* <div>
				<h1 className="text-3xl font-medium text-neutral-900">Auto-reply</h1>
				<p className="mt-1 text-sm text-neutral-500">
					Automatically respond from the selected inbox when you are away or unavailable.
				</p>
			</div> */}

			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-neutral-900">Automatic response</h2>
					<p className="mt-1 text-sm text-neutral-500">Configure the subject and message for the inbox currently selected above.</p>
				</div>
				<div className="rounded-3xl bg-white p-6">
					<MailboxAutoReplyForm />
				</div>
			</section>
		</div>
	);
}
