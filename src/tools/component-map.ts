import { CsvMergeTool } from "@/tools/csv/merge/csv-merge-tool";
import type { ToolComponentMap } from "./types";

export const toolComponentMap = { csvMerge: CsvMergeTool } satisfies ToolComponentMap;
