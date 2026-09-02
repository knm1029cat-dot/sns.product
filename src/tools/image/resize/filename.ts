import type { SupportedImageType } from "./types";

const defaultExtension: Record<SupportedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function createResizedFilename(filename: string, mimeType: SupportedImageType): string {
  const dot = filename.lastIndexOf(".");
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  const currentExtension = dot > 0 ? filename.slice(dot + 1).toLowerCase() : "";
  const extension = mimeType === "image/jpeg" && ["jpg", "jpeg"].includes(currentExtension)
    ? currentExtension
    : defaultExtension[mimeType];
  return `${base}-resized.${extension}`;
}
