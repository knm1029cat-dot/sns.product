import { calculateTargetDimensions } from "./dimensions";
import { ImageResizeError } from "./errors";
import type { ImageRenderer, SupportedImageType } from "./types";

export const resizeImageWithCanvas: ImageRenderer = async (file, targetWidth) => {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageResizeError("画像を読み込めませんでした。ファイルが破損していないか確認してください。");
  }
  try {
    const dimensions = calculateTargetDimensions(bitmap.width, bitmap.height, targetWidth);
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d");
    if (!context) throw new ImageResizeError("このブラウザでは画像を処理できません。");
    context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
    const mimeType = file.type as SupportedImageType;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((output) => output ? resolve(output) : reject(new ImageResizeError("画像の出力に失敗しました。")), mimeType, mimeType === "image/png" ? undefined : 0.92);
    });
    return { ...dimensions, originalWidth: bitmap.width, originalHeight: bitmap.height, blob };
  } finally {
    bitmap.close();
  }
};
