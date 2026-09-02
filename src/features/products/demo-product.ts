import type { ProductRecord } from "./types";
import { csvMergeSpecification } from "@/tools/csv/merge/spec";
import { imageResizeSpecification } from "@/tools/image/resize/spec";

export const demoProduct: ProductRecord = {
  id: "00000000-0000-4000-8000-000000000001", name: csvMergeSpecification.name,
  slug: csvMergeSpecification.slug, category: csvMergeSpecification.category, status: "PUBLISHED",
  short_description: csvMergeSpecification.shortDescription, spec_json: csvMergeSpecification,
  spec_version: csvMergeSpecification.version, published_at: "2026-01-01T00:00:00.000Z",
};

export const imageResizeDemoProduct: ProductRecord = {
  id: "00000000-0000-4000-8000-000000000002", name: imageResizeSpecification.name,
  slug: imageResizeSpecification.slug, category: imageResizeSpecification.category, status: "PUBLISHED",
  short_description: imageResizeSpecification.shortDescription, spec_json: imageResizeSpecification,
  spec_version: imageResizeSpecification.version, published_at: "2026-01-02T00:00:00.000Z",
};

export const demoPublishedProducts = [imageResizeDemoProduct, demoProduct];
