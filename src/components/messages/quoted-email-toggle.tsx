import { useLanguage } from "@/components/language-provider";
import type { QuotedEmailToggleProps } from "./quoted-email-toggle-types";
import { EmailHtmlRenderer } from "./email-html-renderer";

export function QuotedEmailToggle({ html }: QuotedEmailToggleProps) {
	const { t } = useLanguage();
	return (
		<details className="email-quote-toggle">
			<summary aria-label={t("message.quote.toggle")} title={t("message.quote.title")} />
			<EmailHtmlRenderer html={html} preserveLeadingQuote />
		</details>
	);
}
