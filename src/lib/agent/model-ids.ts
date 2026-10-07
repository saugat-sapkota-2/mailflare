export function parseAgentModelIds(value: string): string[] {
	return [...new Set(value.split(",").map((model) => model.trim()).filter(Boolean))];
}

export function toggleAgentModelId(value: string, modelId: string, checked: boolean): string {
	const models = parseAgentModelIds(value);
	return (checked ? [...new Set([...models, modelId])] : models.filter((model) => model !== modelId)).join(", ");
}
