import type { BookingForm, BookingHost } from "./types";

export type BookingEditorProps = {
	form: BookingForm;
	open: boolean;
	editingId: string | null;
	username: string;
	hosts: BookingHost[];
	canManageHosts: boolean;
	currentUserId: string;
	saving: boolean;
	onChange: (form: BookingForm) => void;
	onClose: () => void;
	onSave: () => void;
	onDelete: () => void;
	onToggleEnabled: () => void;
	onClosed: () => void;
};
