export type ComposeTemplate = {
	id: string;
	subject: string | null;
	htmlBody: string | null;
	textBody: string | null;
};

export type TemplateMenuProps = {
	onApply: (template: { title: string; html: string }) => void;
	onNew: () => void;
};

export type NewTemplateDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mailboxId?: string | null;
	from: string;
};
