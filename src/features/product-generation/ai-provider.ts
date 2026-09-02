export interface AiProvider { generateJson(systemPrompt: string, input: unknown): Promise<string>; }
export class AiProviderError extends Error { constructor(message: string) { super(message); this.name = "AiProviderError"; } }
