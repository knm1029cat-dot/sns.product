import { readFile } from "node:fs/promises";
import path from "node:path";
import { productIdeaSchema } from "@/schemas/product-idea";
import { productSpecificationSchema, type ProductSpecification } from "@/schemas/product-spec";
import type { AiProvider } from "./ai-provider";

export const PRODUCT_SPEC_PROMPT_VERSION = 1;
export async function generateProductSpecification(provider: AiProvider, ideaInput: unknown): Promise<ProductSpecification> {
  const idea = productIdeaSchema.parse(ideaInput);
  const prompt = await readFile(path.join(process.cwd(), "src/prompts/product-spec.md"), "utf8");
  const raw = await provider.generateJson(prompt, { promptVersion: PRODUCT_SPEC_PROMPT_VERSION, idea });
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("AIが有効なJSONを返しませんでした。再生成してください。"); }
  return productSpecificationSchema.parse(parsed);
}
