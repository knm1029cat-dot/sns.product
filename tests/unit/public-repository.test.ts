import { describe, expect, it } from "vitest";
import type { DatabaseQuery } from "@/lib/database";
import { queryPublishedProducts } from "@/features/products/public-repository";
import { csvMergeSpecification } from "@/tools/csv/merge/spec";

function row(slug: string, status: "DRAFT" | "PUBLISHED") {
  return {
    id: crypto.randomUUID(), name: slug, slug, category: "csv", status,
    short_description: "description", spec_json: { ...csvMergeSpecification, slug, name: slug },
    spec_version: 1, published_at: status === "PUBLISHED" ? new Date().toISOString() : null,
  };
}

describe("public product repository", () => {
  it("returns only PUBLISHED products that have a Registry implementation", async () => {
    const database: DatabaseQuery = {
      query: async <T extends Record<string, unknown>>() =>
        [row("csv-merge", "PUBLISHED"), row("csv-merge", "DRAFT"), row("missing-tool", "PUBLISHED")] as unknown as T[],
    };
    const products = await queryPublishedProducts(database);
    expect(products.map(({ slug }) => slug)).toEqual(["csv-merge"]);
  });
});
