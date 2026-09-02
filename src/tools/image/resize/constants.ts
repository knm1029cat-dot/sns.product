export const IMAGE_RESIZE_LIMITS = {
  minFiles: 2,
  maxFiles: 10,
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxTotalSizeBytes: 50 * 1024 * 1024,
  maxWidth: 10_000,
} as const;

export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
