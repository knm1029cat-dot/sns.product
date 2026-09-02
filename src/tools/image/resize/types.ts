export type SupportedImageType = "image/jpeg" | "image/png" | "image/webp";

export type ImageResizeResult = {
  originalName: string;
  outputName: string;
  mimeType: SupportedImageType;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  blob: Blob;
};

export type ImageRenderer = (file: File, width: number) => Promise<Omit<ImageResizeResult, "originalName" | "outputName" | "mimeType"> & { blob: Blob }>;
