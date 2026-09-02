import { NextResponse } from "next/server";
import { createDevelopmentPackage, createProductChecklist } from "@/features/product-generation/development-package";
import { createRegistryCandidate } from "@/features/product-generation/registry-candidate";
import { createDraftProductTransaction } from "@/features/products/service";
import { getAdminUser } from "@/lib/auth/session";
import { neonDatabase } from "@/lib/database";
import { productSpecificationSchema } from "@/schemas/product-spec";

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  try {
    const input: unknown = await request.json();
    const registry = createRegistryCandidate(productSpecificationSchema.parse(input));
    const created = await createDraftProductTransaction(neonDatabase, input, admin.id);
    return NextResponse.json({ productId: created.productId, files: createDevelopmentPackage(created.specification, created.productId, registry), checklist: createProductChecklist(created.specification) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "商品を登録できませんでした。" }, { status: 400 });
  }
}
