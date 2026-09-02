import { getAiEnv } from "@/lib/env";
import { AiProviderError, type AiProvider } from "./ai-provider";

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
      const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = body.choices?.[0]?.message?.content;
      if (!content) throw new AiProviderError("AI Providerから有効な応答がありませんでした。");
      return content;
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw new AiProviderError("AI生成がタイムアウトしました。");
      throw new AiProviderError("AI Providerへ接続できませんでした。");
    } finally { clearTimeout(timeout); }
  }
}
