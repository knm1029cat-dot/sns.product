import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { recordAnalyticsEvent } from "@/features/analytics/service";
import { queryPublishedProducts } from "@/features/products/public-repository";
import { publishProductTransaction, saveProductSpecificationTransaction } from "@/features/products/service";
import { neonDatabase } from "@/lib/database";
import { csvMergeSpecification } from "@/tools/csv/merge/spec";

const enabled = process.env.RUN_NEON_INTEGRATION === "true" && Boolean(process.env.DATABASE_URL);
const integration = enabled ? describe : describe.skip;
const productId = randomUUID();
const sessionId = randomUUID();
const originalSlug = `integration-${productId.slice(0, 8)}`;
const updatedSlug = `${originalSlug}-updated`;

integration("Neon integration", () => {
  beforeAll(async () => {
    const specification = { ...csvMergeSpecification, name: "Integration Original", slug: originalSlug, shortDescription: "Original projection" };
    await neonDatabase.query(
      `insert into products(id, name, slug, category, status, short_description, spec_json, spec_version)
       values($1, $2, $3, $4, 'DRAFT', $5, $6::jsonb, 1)`,
      [productId, specification.name, specification.slug, specification.category, specification.shortDescription, JSON.stringify(specification)],
    );
    await neonDatabase.query(
      "insert into product_spec_versions(product_id, version, spec_json, created_by) values($1, 1, $2::jsonb, null)",
      [productId, JSON.stringify(specification)],
    );
  });

  afterAll(async () => {
    await neonDatabase.query("delete from analytics_events where session_id = $1", [sessionId]);
    await neonDatabase.query("delete from products where id = $1", [productId]);
  });

  it("saves a validated specification, increments history and updates projections", async () => {
    const next = { ...csvMergeSpecification, name: "Integration Updated", slug: updatedSlug, category: "csv" as const, shortDescription: "Updated projection" };
    const result = await saveProductSpecificationTransaction(neonDatabase, productId, next, "integration-test");
    expect(result.version).toBe(2);
    const products = await neonDatabase.query<Record<string, unknown>>(
      "select name, slug, category, short_description, spec_version, spec_json from products where id = $1", [productId],
    );
    expect(products[0]).toMatchObject({ name: next.name, slug: next.slug, category: next.category, short_description: next.shortDescription, spec_version: 2 });
    expect((products[0].spec_json as { version: number }).version).toBe(2);
    const history = await neonDatabase.query<{ version: number; created_by: string | null }>(
      "select version, created_by from product_spec_versions where product_id = $1 order by version", [productId],
    );
    expect(history).toEqual([{ version: 1, created_by: null }, { version: 2, created_by: "integration-test" }]);
  });

  it("rejects invalid Zod input before writing", async () => {
    await expect(saveProductSpecificationTransaction(neonDatabase, productId, { ...csvMergeSpecification, slug: "INVALID SLUG" }, null)).rejects.toThrow();
    const rows = await neonDatabase.query<{ spec_version: number }>("select spec_version from products where id = $1", [productId]);
    expect(rows[0].spec_version).toBe(2);
  });

  it("rolls back the complete transaction when a projection update violates uniqueness", async () => {
    await expect(saveProductSpecificationTransaction(neonDatabase, productId, { ...csvMergeSpecification, name: "Must Roll Back", slug: "csv-merge" }, null)).rejects.toThrow();
    const rows = await neonDatabase.query<{ name: string; slug: string; spec_version: number }>(
      "select name, slug, spec_version from products where id = $1", [productId],
    );
    expect(rows[0]).toEqual({ name: "Integration Updated", slug: updatedSlug, spec_version: 2 });
    const history = await neonDatabase.query<{ count: number }>("select count(*)::int as count from product_spec_versions where product_id = $1", [productId]);
    expect(history[0].count).toBe(2);
  });

  it("does not expose DRAFT or missing-Registry products through the public repository", async () => {
    const products = await queryPublishedProducts(neonDatabase);
    expect(products.some(({ id }) => id === productId)).toBe(false);
    expect(products.every(({ status }) => status === "PUBLISHED")).toBe(true);
  });

  it("refuses to publish a product without a Registry implementation", async () => {
    await expect(publishProductTransaction(neonDatabase, productId)).rejects.toThrow("Tool Registry");
    const rows = await neonDatabase.query<{ status: string; published_at: string | null }>(
      "select status, published_at from products where id = $1", [productId],
    );
    expect(rows[0]).toEqual({ status: "DRAFT", published_at: null });
  });

  it("stores all allowed Analytics events without sensitive metadata", async () => {
    const events = [
      { eventName: "page_view" as const, metadata: { pageType: "tool" as const } },
      { eventName: "tool_open" as const, metadata: { toolSlug: "csv-merge" as const } },
      { eventName: "tool_started" as const, metadata: { toolSlug: "csv-merge" as const, fileCount: 2 } },
      { eventName: "tool_completed" as const, metadata: { toolSlug: "csv-merge" as const, fileCount: 2, rowCountBucket: "1-100" as const } },
      { eventName: "download_clicked" as const, metadata: { toolSlug: "csv-merge" as const } },
    ];
    for (const event of events) await recordAnalyticsEvent(neonDatabase, { ...event, sessionId, productId });
    const rows = await neonDatabase.query<{ event_name: string; metadata_json: Record<string, unknown> }>(
      "select event_name, metadata_json from analytics_events where session_id = $1 order by created_at", [sessionId],
    );
    expect(new Set(rows.map(({ event_name }) => event_name))).toEqual(new Set(events.map(({ eventName }) => eventName)));
    const storedKeys = rows.flatMap(({ metadata_json }) => Object.keys(metadata_json));
    for (const forbidden of ["fileName", "headers", "csvContent", "filePath", "file", "blob", "personalInfo", "secret", "apiKey"]) {
      expect(storedKeys).not.toContain(forbidden);
    }
  });

  it("enforces PostgreSQL constraints", async () => {
    async function rejected(sql: string, params: readonly unknown[]) {
      await expect(neonDatabase.transaction(async (transaction) => {
        await transaction.query(sql, params);
      })).rejects.toThrow();
    }
    const spec = JSON.stringify(csvMergeSpecification);
    await rejected("insert into products(name,slug,category,status,short_description,spec_json,spec_version) values('x','csv-merge','csv','DRAFT','x',$1::jsonb,1)", [spec]);
    await rejected("insert into products(name,slug,category,status,short_description,spec_json,spec_version) values('x','INVALID SLUG','csv','DRAFT','x',$1::jsonb,1)", [spec]);
    await rejected("insert into products(name,slug,category,status,short_description,spec_json,spec_version) values('x','invalid-version','csv','DRAFT','x',$1::jsonb,0)", [spec]);
    await rejected("insert into products(name,slug,category,status,short_description,spec_json,spec_version,published_at) values('x','draft-with-date','csv','DRAFT','x',$1::jsonb,1,now())", [spec]);
    await rejected("insert into products(name,slug,category,status,short_description,spec_json,spec_version) values('x','published-no-date','csv','PUBLISHED','x',$1::jsonb,1)", [spec]);
    await rejected("insert into product_spec_versions(product_id,version,spec_json) values($1,2,$2::jsonb)", [productId, spec]);
    await rejected("insert into analytics_events(event_name,session_id) values('not_allowed',$1)", [randomUUID()]);
  });
});
