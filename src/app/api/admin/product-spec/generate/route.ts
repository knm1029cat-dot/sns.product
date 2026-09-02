import { NextResponse } from "next/server";
import { generateProductSpecification } from "@/features/product-generation/generate-spec";
import { OpenAiCompatibleProvider } from "@/features/product-generation/openai-compatible-provider";
import { createRegistryCandidate } from "@/features/product-generation/registry-candidate";
import { getAdminUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  try {
    const specification = await generateProductSpecification(new OpenAiCompatibleProvider(), await request.json());
    const registry = createRegistryCandidate(specification);
    return NextResponse.json({ specification, registry });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "仕様を生成できませんでした。" }, { status: 400 });
  }
}
