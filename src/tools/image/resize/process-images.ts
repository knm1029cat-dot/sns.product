import { createResizedFilename } from "./filename";
import { resizeImageWithCanvas } from "./resize-image";
import type { ImageRenderer, ImageResizeResult, SupportedImageType } from "./types";
import { validateImageFiles, validateTargetWidth } from "./validate-files";

export async function processImages(
  files: readonly File[],
  targetWidth: number,
  renderer: ImageRenderer = resizeImageWithCanvas,
): Promise<ImageResizeResult[]> {
  validateImageFiles(files);
  validateTargetWidth(targetWidth);
  const results: ImageResizeResult[] = [];
  for (const file of files) {
    const mimeType = file.type as SupportedImageType;
    const resized = await renderer(file, targetWidth);
    results.push({
      ...resized,
      originalName: file.name,
      outputName: createResizedFilename(file.name, mimeType),
      mimeType,
    });
  }
  return results;
}
