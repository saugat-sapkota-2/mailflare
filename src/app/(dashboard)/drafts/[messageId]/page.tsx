import DraftsPage from "../page";
import { OpenDraftOnRoute } from "./open-draft-on-route";
import type { DraftRoutePageProps } from "./types";

export default async function DraftMessagePage({ params }: DraftRoutePageProps) {
	const { messageId } = await params;
	return <><DraftsPage /><OpenDraftOnRoute draftId={messageId} /></>;
}
