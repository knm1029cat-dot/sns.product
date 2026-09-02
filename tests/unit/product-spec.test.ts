import { describe, expect, it } from "vitest";
import { productSpecificationSchema } from "@/schemas/product-spec";
import { analyticsEventSchema } from "@/schemas/analytics";
import { csvMergeSpecification } from "@/tools/csv/merge/spec";
import { imageResizeSpecification } from "@/tools/image/resize/spec";

describe("Product Specification", () => {
  it("validates the CSV merge specification", () => {
    expect(productSpecificationSchema.parse(csvMergeSpecification)).toEqual(csvMergeSpecification);
  });

  it("validates the image resize specification without changing the schema", () => {
    expect(productSpecificationSchema.parse(imageResizeSpecification)).toEqual(imageResizeSpecification);
  });

  it("rejects invalid slugs and duplicate test IDs", () => {
    const invalid = {
      ...csvMergeSpecification,
      slug: "CSV Merge",
      testCases: [csvMergeSpecification.testCases[0], csvMergeSpecification.testCases[0]],
    };
    expect(productSpecificationSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("Analytics schema", () => {
  const sessionId = "00000000-0000-4000-8000-000000000002";

  it("accepts only the fixed metadata schema", () => {
    expect(analyticsEventSchema.safeParse({
      eventName: "tool_started",
      sessionId,
      metadata: { toolSlug: "csv-merge", fileCount: 2 },
    }).success).toBe(true);
  });

  it("accepts image events with only allowlisted aggregate counts", () => {
    expect(analyticsEventSchema.safeParse({
      eventName: "tool_completed",
      sessionId,
      metadata: { toolSlug: "image-resize", fileCount: 2, outputCount: 2 },
    }).success).toBe(true);
    expect(analyticsEventSchema.safeParse({
      eventName: "tool_completed",
      sessionId,
      metadata: { toolSlug: "image-resize", fileCount: 2, outputCount: 2, fileName: "private.png" },
    }).success).toBe(false);
  });

  it.each(["fileName", "csv", "headers", "filePath", "secret", "apiKey"])(
    "rejects forbidden arbitrary metadata: %s",
    (key) => {
      expect(analyticsEventSchema.safeParse({
        eventName: "tool_open",
        sessionId,
        metadata: { toolSlug: "csv-merge", [key]: "sensitive" },
      }).success).toBe(false);
    },
  );
});
