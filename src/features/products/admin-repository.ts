import { neonDatabase, type DatabaseQuery } from "@/lib/database";
import { isDatabaseConfigured } from "@/lib/env";
import { demoProduct } from "./demo-product";
import { parseProductRow, type ProductRecord } from "./types";

const columns = "id, name, slug, category, status, short_description, spec_json, spec_version, published_at";

export async function queryAllProductsForAdmin(database: DatabaseQuery): Promise<ProductRecord[]> {
  const rows = await database.query<Record<string, unknown>>(`select ${columns} from products order by created_at`);
  return rows.map(parseProductRow).filter((product): product is ProductRecord => product !== null);
}

export async function queryAdminProduct(database: DatabaseQuery, id: string): Promise<ProductRecord | null> {
  const rows = await database.query<Record<string, unknown>>(`select ${columns} from products where id = $1 limit 1`, [id]);
  return rows[0] ? parseProductRow(rows[0]) : null;
}

export const getAllProductsForAdmin = () =>
  !isDatabaseConfigured() && process.env.TOOL_FACTORY_DEMO_DATA === "true" ? Promise.resolve([demoProduct]) : queryAllProductsForAdmin(neonDatabase);
export const getAdminProduct = (id: string) =>
  !isDatabaseConfigured() && process.env.TOOL_FACTORY_DEMO_DATA === "true"
    ? Promise.resolve(id === demoProduct.id ? demoProduct : null)
    : queryAdminProduct(neonDatabase, id);
