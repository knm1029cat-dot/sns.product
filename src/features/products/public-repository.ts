import { neonDatabase, type DatabaseQuery } from "@/lib/database";
import { isDatabaseConfigured } from "@/lib/env";
import { getToolDefinition } from "@/tools/registry";
import { demoProduct } from "./demo-product";
import { parseProductRow, type ProductRecord } from "./types";

const columns = "id, name, slug, category, status, short_description, spec_json, spec_version, published_at";

export async function queryPublishedProducts(database: DatabaseQuery): Promise<ProductRecord[]> {
  const rows = await database.query<Record<string, unknown>>(`select ${columns} from products where status = 'PUBLISHED' order by published_at desc`);
  return rows.map(parseProductRow).filter((product): product is ProductRecord =>
    product !== null && product.status === "PUBLISHED" && Boolean(getToolDefinition(product.slug)),
  );
}

export async function queryPublishedProductBySlug(database: DatabaseQuery, slug: string): Promise<ProductRecord | null> {
  const rows = await database.query<Record<string, unknown>>(`select ${columns} from products where status = 'PUBLISHED' and slug = $1 limit 1`, [slug]);
  const product = rows[0] ? parseProductRow(rows[0]) : null;
  return product?.status === "PUBLISHED" && getToolDefinition(product.slug) ? product : null;
}

export async function getPublishedProducts() {
  if (!isDatabaseConfigured()) return process.env.TOOL_FACTORY_DEMO_DATA === "true" ? [demoProduct] : [];
  return queryPublishedProducts(neonDatabase);
}

export async function getPublishedProductBySlug(slug: string) {
  if (!isDatabaseConfigured()) return process.env.TOOL_FACTORY_DEMO_DATA === "true" && slug === demoProduct.slug ? demoProduct : null;
  return queryPublishedProductBySlug(neonDatabase, slug);
}
