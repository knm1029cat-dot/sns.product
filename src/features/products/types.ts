import { productSpecificationSchema, type ProductSpecification } from "@/schemas/product-spec";

export type ProductRecord = {
  id: string; name: string; slug: string; category: string;
  status: "DRAFT" | "PUBLISHED"; short_description: string;
  spec_json: ProductSpecification; spec_version: number; published_at: string | null;
};

export function parseProductRow(row: Record<string, unknown>): ProductRecord | null {
  const specification = productSpecificationSchema.safeParse(row.spec_json);
  if (!specification.success || (row.status !== "DRAFT" && row.status !== "PUBLISHED")) return null;
  return {
    id: String(row.id), name: String(row.name), slug: String(row.slug), category: String(row.category),
    status: row.status, short_description: String(row.short_description), spec_json: specification.data,
    spec_version: Number(row.spec_version), published_at: row.published_at ? String(row.published_at) : null,
  };
}
