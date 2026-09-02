import type { z } from "zod";
import { toolCategorySchema } from "@/schemas/product-spec";
import type { ToolDefinition } from "./types";

export type ToolCategory = z.infer<typeof toolCategorySchema>;

export const toolRegistry = {
  "csv-merge": {
    id: "csv-merge",
    slug: "csv-merge",
    name: "CSV一括結合ツール",
    category: "csv",
    componentKey: "csvMerge",
    acceptedFileTypes: [".csv", "text/csv"],
  },
} as const satisfies Record<string, ToolDefinition>;

export function getToolDefinition(slug: string): ToolDefinition | undefined {
  return toolRegistry[slug as keyof typeof toolRegistry];
}
