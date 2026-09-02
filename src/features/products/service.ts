import type { Database } from "@/lib/database";
import { productSpecificationSchema, type ProductSpecification } from "@/schemas/product-spec";
import { getToolDefinition } from "@/tools/registry";

export async function saveProductSpecificationTransaction(
  database: Database, productId: string, input: unknown, createdBy: string | null,
): Promise<{ version: number; specification: ProductSpecification }> {
  const validated = productSpecificationSchema.parse(input);
  return database.transaction(async (transaction) => {
    const current = await transaction.query<{ spec_version: number }>("select spec_version from products where id = $1 for update", [productId]);
    if (!current[0]) throw new Error("商品が見つかりません。");
    const version = Number(current[0].spec_version) + 1;
    const specification = productSpecificationSchema.parse({ ...validated, version });
    const updated = await transaction.query<{ id: string }>(
      `update products set spec_json = $2::jsonb, spec_version = $3, name = $4, slug = $5,
       category = $6, short_description = $7, updated_at = now() where id = $1 returning id`,
      [productId, JSON.stringify(specification), version, specification.name, specification.slug, specification.category, specification.shortDescription],
    );
    if (!updated[0]) throw new Error("商品の更新に失敗しました。");
    await transaction.query(
      "insert into product_spec_versions(product_id, version, spec_json, created_by) values($1, $2, $3::jsonb, $4)",
      [productId, version, JSON.stringify(specification), createdBy],
    );
    return { version, specification };
  });
}

export async function createDraftProductTransaction(database: Database, input: unknown, createdBy: string | null) {
  const specification = productSpecificationSchema.parse({ ...(input as object), version: 1 });
  return database.transaction(async (transaction) => {
    const duplicate = await transaction.query<{ id: string }>("select id from products where slug = $1 limit 1", [specification.slug]);
    if (duplicate[0]) throw new Error("このslugの商品は既に登録されています。");
    const rows = await transaction.query<{ id: string }>(
      `insert into products(name, slug, category, status, short_description, spec_json, spec_version, published_at)
       values($1, $2, $3, 'DRAFT', $4, $5::jsonb, 1, null) returning id`,
      [specification.name, specification.slug, specification.category, specification.shortDescription, JSON.stringify(specification)],
    );
    if (!rows[0]) throw new Error("DRAFT商品の登録に失敗しました。");
    await transaction.query("insert into product_spec_versions(product_id, version, spec_json, created_by) values($1, 1, $2::jsonb, $3)", [rows[0].id, JSON.stringify(specification), createdBy]);
    return { productId: rows[0].id, specification };
  });
}

export async function publishProductTransaction(database: Database, productId: string): Promise<{ slug: string }> {
  return database.transaction(async (transaction) => {
    const rows = await transaction.query<Record<string, unknown>>(
      "select id, slug, status, spec_json from products where id = $1 for update", [productId],
    );
    const product = rows[0];
    if (!product) throw new Error("商品が見つかりません。");
    if (product.status !== "DRAFT") throw new Error("DRAFTの商品だけを公開できます。");
    const specification = productSpecificationSchema.parse(product.spec_json);
    if (specification.slug !== product.slug) throw new Error("商品仕様と投影slugが一致しません。");
    if (!getToolDefinition(specification.slug)) throw new Error("対応するTool Registry実装がありません。");
    const updated = await transaction.query<{ slug: string }>(
      "update products set status = 'PUBLISHED', published_at = now(), updated_at = now() where id = $1 and status = 'DRAFT' returning slug",
      [productId],
    );
    if (!updated[0]) throw new Error("公開状態を更新できませんでした。");
    return updated[0];
  });
}
