"use client";

import { createContext, useContext } from "react";

export const AssistantOpenContext = createContext(false);

export function useAssistantOpen() {
	return useContext(AssistantOpenContext);
}
