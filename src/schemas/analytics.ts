import { z } from "zod";

const base = {
  sessionId: z.uuid(),
  productId: z.uuid().nullable().optional(),
};

export const analyticsEventSchema = z.discriminatedUnion("eventName", [
  z.object({ ...base, eventName: z.literal("page_view"), metadata: z.object({ pageType: z.enum(["home", "tools", "tool"]) }).strict() }).strict(),
  z.object({ ...base, eventName: z.literal("tool_open"), metadata: z.object({ toolSlug: z.literal("csv-merge") }).strict() }).strict(),
  z.object({ ...base, eventName: z.literal("tool_started"), metadata: z.object({ toolSlug: z.literal("csv-merge"), fileCount: z.number().int().min(2).max(10) }).strict() }).strict(),
  z.object({ ...base, eventName: z.literal("tool_completed"), metadata: z.object({ toolSlug: z.literal("csv-merge"), fileCount: z.number().int().min(2).max(10), rowCountBucket: z.enum(["0", "1-100", "101-1000", "1001+"]) }).strict() }).strict(),
  z.object({ ...base, eventName: z.literal("download_clicked"), metadata: z.object({ toolSlug: z.literal("csv-merge") }).strict() }).strict(),
]);

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
