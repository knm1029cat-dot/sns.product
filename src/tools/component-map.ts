import { CsvMergeTool } from "@/tools/csv/merge/csv-merge-tool";
import { ImageResizeTool } from "@/tools/image/resize/image-resize-tool";
import type { ToolComponentMap } from "./types";

export const toolComponentMap = { csvMerge: CsvMergeTool, imageResize: ImageResizeTool } satisfies ToolComponentMap;
