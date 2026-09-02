import { ImageResizeError } from "./errors";

export function calculateTargetDimensions(originalWidth: number, originalHeight: number, targetWidth: number) {
  if (originalWidth < 1 || originalHeight < 1) throw new ImageResizeError("画像サイズを読み取れませんでした。");
  return { width: targetWidth, height: Math.max(1, Math.round(originalHeight * targetWidth / originalWidth)) };
}
