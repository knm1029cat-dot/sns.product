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
    usageSteps: ["CSVを2〜10件選択", "結合ボタンを押す", "結果を確認してダウンロード"],
  },
  "image-resize": {
    id: "image-resize",
    slug: "image-resize",
    name: "画像一括リサイズ",
    category: "image",
    componentKey: "imageResize",
    acceptedFileTypes: [".jpg", ".jpeg", ".png", ".webp", "image/jpeg", "image/png", "image/webp"],
    usageSteps: ["画像を2〜10件選択", "出力する横幅を指定して一括処理", "結果を確認して個別またはZIPでダウンロード"],
  },
} as const satisfies Record<string, ToolDefinition>;

export function getToolDefinition(slug: string): ToolDefinition | undefined {
  return toolRegistry[slug as keyof typeof toolRegistry];
}
