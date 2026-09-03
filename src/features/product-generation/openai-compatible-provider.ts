import { getAiEnv } from "@/lib/env";
import { AiProviderError, type AiProvider } from "./ai-provider";

type ChatCompletionResponse = { choices?: Array<{ message?: { content?: unknown } }> };

export function extractChatCompletionContent(body: unknown): string {
  if (!body || typeof body !== "object") throw new AiProviderError("AI Providerのレスポンス形式が不正です。");
  const content = (body as ChatCompletionResponse).choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new AiProviderError("AI Providerのchoices[0].message.contentに文字列がありません。");
  }
  return content;
}

export class OpenAiCompatibleProvider implements AiProvider {
  async generateJson(systemPrompt: string, input: unknown): Promise<string> {
    const env = getAiEnv();
    if (!env.success) throw new AiProviderError("AI Providerの環境変数が設定されていません。");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(env.data.AI_PROVIDER_ENDPOINT, {
        method: "POST", signal: controller.signal,
        headers: { authorization: `Bearer ${env.data.AI_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ model: env.data.AI_MODEL, response_format: { type: "json_object" }, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: JSON.stringify(input) }] }),
      });
      if (!response.ok) throw new AiProviderError(`AI Providerがエラーを返しました（${response.status}）。`);
      const body: unknown = await response.json();
      return extractChatCompletionContent(body);
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw new AiProviderError("AI生成がタイムアウトしました。");
      throw new AiProviderError("AI Providerへ接続できませんでした。");
    } finally { clearTimeout(timeout); }
  }
}
