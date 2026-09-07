import { InboxRules } from "@/components/settings/inbox-rules";
import { DomainRouting } from "@/components/settings/domain-routing/domain-routing";

export default function SettingsRulesPage() {
	return (
		<div className="space-y-8">
			{/* <div>
				<h1 className="text-3xl font-medium text-neutral-900">Rules</h1>
				<p className="mt-1 text-sm text-neutral-500">
					Rules for the selected inbox.
				</p>
			</div> */}
			<div>
				<DomainRouting />
			</div>
			<div className="py-6">
				<InboxRules />
			</div>
		</div>
	);
}
