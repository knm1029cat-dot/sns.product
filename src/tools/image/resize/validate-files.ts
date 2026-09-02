import { IMAGE_RESIZE_LIMITS, SUPPORTED_IMAGE_TYPES } from "./constants";
import { ImageResizeError } from "./errors";
import type { SupportedImageType } from "./types";

const extensions: Record<SupportedImageType, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export function validateImageFiles(files: readonly File[]): void {
  if (files.length < IMAGE_RESIZE_LIMITS.minFiles) throw new ImageResizeError("画像を2件以上選択してください。");
  if (files.length > IMAGE_RESIZE_LIMITS.maxFiles) throw new ImageResizeError("選択できる画像は10件までです。");
  let totalSize = 0;
  for (const file of files) {
    const type = file.type as SupportedImageType;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!SUPPORTED_IMAGE_TYPES.includes(type) || !extensions[type]?.includes(extension)) {
      throw new ImageResizeError("JPEG、PNG、WebP形式の画像のみ利用できます。");
    }
    if (file.size > IMAGE_RESIZE_LIMITS.maxFileSizeBytes) throw new ImageResizeError("1ファイルのサイズは10MBまでです。");
    totalSize += file.size;
  }
  if (totalSize > IMAGE_RESIZE_LIMITS.maxTotalSizeBytes) throw new ImageResizeError("画像の合計サイズは50MBまでです。");
}

export function validateTargetWidth(width: number): void {
  if (!Number.isInteger(width) || width < 1 || width > IMAGE_RESIZE_LIMITS.maxWidth) {
    throw new ImageResizeError("横幅は1〜10,000pxの整数で指定してください。");
  }
}
