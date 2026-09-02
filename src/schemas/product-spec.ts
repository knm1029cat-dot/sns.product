import { z } from "zod";

export const toolCategorySchema = z.enum([
  "csv",
  "excel",
  "image",
  "file",
  "text",
  "sns",
  "ai",
]);

export const analyticsEventNameSchema = z.enum([
  "page_view",
  "tool_open",
  "tool_started",
  "tool_completed",
  "download_clicked",
]);

const nonEmptyString = z.string().trim().min(1);

export const productSpecificationSchema = z
  .object({
    schemaVersion: z.literal(1),
    version: z.number().int().positive(),
    locale: z.literal("ja-JP"),
    name: nonEmptyString.max(120),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    category: toolCategorySchema,
    shortDescription: nonEmptyString.max(240),
    targetUser: nonEmptyString,
    problem: nonEmptyString,
    solution: nonEmptyString,
    input: z.object({
      type: z.enum(["files", "file", "text"]),
      acceptedTypes: z.array(nonEmptyString).optional(),
      multiple: z.boolean().optional(),
    }),
    output: z.object({
      type: z.enum(["file", "text", "preview"]),
      description: nonEmptyString,
    }),
    processing: z.object({
      location: z.enum(["client", "server"]),
      maxFiles: z.number().int().positive().optional(),
      maxFileSizeBytes: z.number().int().positive().optional(),
      maxTotalSizeBytes: z.number().int().positive().optional(),
    }),
    features: z.array(nonEmptyString).min(1),
    nonFeatures: z.array(nonEmptyString),
    processingRules: z.array(nonEmptyString).min(1),
    validationRules: z.array(nonEmptyString).min(1),
    errorCases: z.array(
      z.object({ condition: nonEmptyString, message: nonEmptyString }),
    ),
    limitations: z.array(nonEmptyString),
    acceptanceCriteria: z.array(nonEmptyString).min(1),
    testCases: z.array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        type: z.enum(["unit", "integration", "e2e", "manual"]),
        title: nonEmptyString,
        steps: z.array(nonEmptyString).min(1),
        expectedResult: nonEmptyString,
      }),
    ),
    analytics: z.object({
      category: nonEmptyString,
      enabledEvents: z.array(analyticsEventNameSchema).min(1),
    }),
  })
  .superRefine((spec, context) => {
    const { processing } = spec;
    if (
      processing.maxFileSizeBytes !== undefined &&
      processing.maxTotalSizeBytes !== undefined &&
      processing.maxTotalSizeBytes < processing.maxFileSizeBytes
    ) {
      context.addIssue({
        code: "custom",
        path: ["processing", "maxTotalSizeBytes"],
        message: "合計サイズ上限は1ファイルのサイズ上限以上にしてください。",
      });
    }
    if (spec.input.multiple && (processing.maxFiles ?? 0) < 2) {
      context.addIssue({
        code: "custom",
        path: ["processing", "maxFiles"],
        message: "複数ファイル入力では最大ファイル数を2以上にしてください。",
      });
    }
    const ids = spec.testCases.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        path: ["testCases"],
        message: "テストケースIDは重複できません。",
      });
    }
  });

export type ProductSpecification = z.infer<typeof productSpecificationSchema>;
export type AnalyticsEventName = z.infer<typeof analyticsEventNameSchema>;
