import { afterEach, describe, expect, it, vi } from "vitest";
import type { AiProvider } from "@/features/product-generation/ai-provider";
import { createDevelopmentPackage } from "@/features/product-generation/development-package";
import { generateProductSpecification, PRODUCT_SPEC_PROMPT_VERSION } from "@/features/product-generation/generate-spec";
import { extractChatCompletionContent, OpenAiCompatibleProvider } from "@/features/product-generation/openai-compatible-provider";
import { createRegistryCandidate, validateRegistryCandidate } from "@/features/product-generation/registry-candidate";
import { imageResizeSpecification } from "@/tools/image/resize/spec";

const specification = { ...imageResizeSpecification, name: "画像一括圧縮", slug: "image-compress", shortDescription: "複数画像をまとめて軽くします。" };
const provider = (output: string): AiProvider => ({ generateJson: async () => output });

describe("Product Specification生成", () => {
  it("正常AI JSONをZod検証して返す", async () => {
    await expect(generateProductSpecification(provider(JSON.stringify(specification)), { name: "画像一括圧縮" })).resolves.toEqual(specification);
  });
  it("不正JSONを拒否する", async () => {
    await expect(generateProductSpecification(provider("not json"), { name: "test" })).rejects.toThrow("有効なJSON");
  });
  it("Markdown code fence付きJSONを正規化して検証する", async () => {
    await expect(generateProductSpecification(provider(`\`\`\`json\n${JSON.stringify(specification)}\n\`\`\``), { name: "test" })).resolves.toEqual(specification);
  });
  it("別オブジェクトで包まれたrootを明示的に拒否する", async () => {
    await expect(generateProductSpecification(provider(JSON.stringify({ productSpecification: specification })), { name: "test" })).rejects.toThrow("root");
  });
  it.each([[{ ...specification, slug: "Invalid Slug" }], [{ ...specification, category: "video" }], [{ ...specification, features: [] }]])("Zod不一致を拒否する", async (invalid) => {
    await expect(generateProductSpecification(provider(JSON.stringify(invalid)), { name: "test" })).rejects.toThrow();
  });
  it("Prompt versionを記録してAIへ渡す", async () => {
    let received: unknown;
    const spy: AiProvider = { generateJson: async (_prompt, input) => { received = input; return JSON.stringify(specification); } };
    await generateProductSpecification(spy, { name: "test" });
    expect(received).toMatchObject({ promptVersion: PRODUCT_SPEC_PROMPT_VERSION });
  });
});

describe("OpenAI Chat Completions response", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("choices[0].message.contentの文字列だけを取得する", () => {
    expect(extractChatCompletionContent({ id: "chatcmpl-test", choices: [{ message: { role: "assistant", content: "{\"ok\":true}" } }] })).toBe("{\"ok\":true}");
  });
  it.each([{}, { choices: [] }, { choices: [{ message: {} }] }, { choices: [{ message: { content: null } }] }, { choices: [{ message: { content: { text: "json" } } }] }])("content不存在または非文字列を拒否する", (response) => {
    expect(() => extractChatCompletionContent(response)).toThrow("choices[0].message.content");
  });
  it("mock Chat Completions responseから本文を返す", async () => {
    vi.stubEnv("AI_PROVIDER_ENDPOINT", "https://api.openai.test/v1/chat/completions");
    vi.stubEnv("AI_API_KEY", "test-only-key");
    vi.stubEnv("AI_MODEL", "test-model");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(specification) } }] }), { status: 200 })));
    await expect(new OpenAiCompatibleProvider().generateJson("prompt", { idea: "test" })).resolves.toBe(JSON.stringify(specification));
  });
});

describe("Registry整合性", () => {
  it("仕様と一致する候補を生成する", () => {
    expect(createRegistryCandidate(specification)).toEqual({ slug: "image-compress", name: "画像一括圧縮", category: "image", componentKey: "imageCompress", acceptedFileTypes: specification.input.acceptedTypes });
  });
  it("重複slugを拒否する", () => {
    expect(() => createRegistryCandidate(imageResizeSpecification)).toThrow("slug");
  });
  it("重複componentKeyを拒否する", () => {
    const candidate = createRegistryCandidate(specification);
    expect(() => validateRegistryCandidate(candidate, { another: { componentKey: "imageCompress" } })).toThrow("componentKey");
  });
});

describe("Development Package", () => {
  const candidate = createRegistryCandidate(specification);
  const files = createDevelopmentPackage(specification, "00000000-0000-4000-8000-000000000099", candidate, "2026-09-02T00:00:00.000Z");
  it("必要な6ファイルを生成する", () => expect(Object.keys(files)).toEqual([
    "product-development/image-compress/SPEC.md", "product-development/image-compress/IMPLEMENTATION.md",
    "product-development/image-compress/REGISTRY_PATCH.md", "product-development/image-compress/TEST_CASES.md",
    "product-development/image-compress/QA_CHECKLIST.md", "product-development/image-compress/PRODUCT_META.json",
  ]));
  it("各文書へ必要情報を含める", () => {
    expect(files["product-development/image-compress/SPEC.md"]).toContain("Acceptance criteria");
    expect(files["product-development/image-compress/IMPLEMENTATION.md"]).toContain("自動公開しない");
    expect(files["product-development/image-compress/REGISTRY_PATCH.md"]).toContain("imageCompress");
    expect(files["product-development/image-compress/TEST_CASES.md"]).toContain("Analytics漏洩防止");
    expect(files["product-development/image-compress/QA_CHECKLIST.md"]).toContain("Network送信内容");
    expect(JSON.parse(files["product-development/image-compress/PRODUCT_META.json"])).toMatchObject({ slug: "image-compress", componentKey: "imageCompress", generatedAt: "2026-09-02T00:00:00.000Z" });
  });
  it("Secretやファイルデータを生成物へ含めない", () => expect(Object.values(files).join("\n")).not.toMatch(/AI_API_KEY|DATABASE_URL|SESSION_SECRET/));
});
