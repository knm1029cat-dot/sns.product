import type { ProductRecord } from "./types";
import { csvMergeSpecification } from "@/tools/csv/merge/spec";

export const demoProduct: ProductRecord = {
  id: "00000000-0000-4000-8000-000000000001", name: csvMergeSpecification.name,
  slug: csvMergeSpecification.slug, category: csvMergeSpecification.category, status: "PUBLISHED",
  short_description: csvMergeSpecification.shortDescription, spec_json: csvMergeSpecification,
  spec_version: csvMergeSpecification.version, published_at: "2026-01-01T00:00:00.000Z",
};
