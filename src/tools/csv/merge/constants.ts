export const CSV_LIMITS = {
  minFiles: 2,
  maxFiles: 10,
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxTotalSizeBytes: 50 * 1024 * 1024,
} as const;

export const UTF8_BOM = "\uFEFF";

export const ALLOWED_CSV_MIME_TYPES = new Set([
  "",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
]);
