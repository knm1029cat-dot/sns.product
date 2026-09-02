import { zipSync } from "fflate";
import type { ImageResizeResult } from "./types";

export async function createImagesZip(results: readonly ImageResizeResult[]): Promise<Blob> {
  const entries: Record<string, Uint8Array> = {};
  for (const result of results) entries[result.outputName] = new Uint8Array(await result.blob.arrayBuffer());
  return new Blob([zipSync(entries)], { type: "application/zip" });
}
