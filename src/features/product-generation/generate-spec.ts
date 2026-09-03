import { readFile } from "node:fs/promises";
import path from "node:path";
import { productIdeaSchema } from "@/schemas/product-idea";
import { productSpecificationSchema, type ProductSpecification } from "@/schemas/product-spec";
import type { AiProvider } from "./ai-provider";

export const PRODUCT_SPEC_PROMPT_VERSION = 2;

export function normalizeJsonResponse(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function assertProductSpecificationRoot(parsed: unknown): asserts parsed is Record<string, unknown> {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI出力のrootはProduct Specification objectである必要があります。");
  }
  const keys = Object.keys(parsed);
  if (!keys.includes("name") || !keys.includes("slug") || !keys.includes("category")) {
    throw new Error(`AI出力のrootがProduct Specificationではありません（検出キー: ${keys.slice(0, 8).join(", ") || "なし"}）。再生成してください。`);
  }
}

export async function generateProductSpecification(provider: AiProvider, ideaInput: unknown): Promise<ProductSpecification> {
  const idea = productIdeaSchema.parse(ideaInput);
  const prompt = await readFile(path.join(process.cwd(), "src/prompts/product-spec.md"), "utf8");
  const raw = await provider.generateJson(prompt, { promptVersion: PRODUCT_SPEC_PROMPT_VERSION, idea });
  let parsed: unknown;
  try { parsed = JSON.parse(normalizeJsonResponse(raw)); } catch { throw new Error("AIが有効なJSONを返しませんでした。再生成してください。"); }
  assertProductSpecificationRoot(parsed);
  return productSpecificationSchema.parse(parsed);
}
