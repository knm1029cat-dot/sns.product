import { z } from "zod";

const base = {
  sessionId: z.uuid(),
  productId: z.uuid().nullable().optional(),
};

const toolSlug = z.enum(["csv-merge", "image-resize"]);

export const analyticsEventSchema = z.discriminatedUnion("eventName", [
  z.object({ ...base, eventName: z.literal("page_view"), metadata: z.object({ pageType: z.enum(["home", "tools", "tool"]) }).strict() }).strict(),
  z.object({ ...base, eventName: z.literal("tool_open"), metadata: z.object({ toolSlug }).strict() }).strict(),
  z.object({ ...base, eventName: z.literal("tool_started"), metadata: z.object({ toolSlug, fileCount: z.number().int().min(2).max(10) }).strict() }).strict(),
  z.object({ ...base, eventName: z.literal("tool_completed"), metadata: z.union([
    z.object({ toolSlug: z.literal("csv-merge"), fileCount: z.number().int().min(2).max(10), rowCountBucket: z.enum(["0", "1-100", "101-1000", "1001+"]) }).strict(),
    z.object({ toolSlug: z.literal("image-resize"), fileCount: z.number().int().min(2).max(10), outputCount: z.number().int().min(2).max(10) }).strict(),
  ]) }).strict(),
  z.object({ ...base, eventName: z.literal("download_clicked"), metadata: z.object({ toolSlug }).strict() }).strict(),
]);

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
