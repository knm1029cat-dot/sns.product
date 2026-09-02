import { ALLOWED_CSV_MIME_TYPES, CSV_LIMITS } from "./constants";
import { CsvProcessingError } from "./errors";
import type { CsvInputFile } from "./types";

export function validateFiles(files: readonly CsvInputFile[]): void {
  if (files.length < CSV_LIMITS.minFiles || files.length > CSV_LIMITS.maxFiles) {
    throw new CsvProcessingError(
      "INVALID_FILE_COUNT",
      `CSVファイルを${CSV_LIMITS.minFiles}〜${CSV_LIMITS.maxFiles}件選択してください。`,
    );
  }

  let totalSize = 0;
  for (const file of files) {
    const hasCsvExtension = file.name.toLocaleLowerCase("en-US").endsWith(".csv");
    if (!hasCsvExtension || !ALLOWED_CSV_MIME_TYPES.has(file.type.toLocaleLowerCase("en-US"))) {
      throw new CsvProcessingError(
        "INVALID_FILE_TYPE",
        `${file.name}は対応しているCSVファイルではありません。`,
      );
    }
    if (file.size === 0) {
      throw new CsvProcessingError("EMPTY_FILE", `${file.name}は空のファイルです。`);
    }
    if (file.size > CSV_LIMITS.maxFileSizeBytes) {
      throw new CsvProcessingError(
        "FILE_TOO_LARGE",
        `${file.name}は1ファイルあたり10MBの上限を超えています。`,
      );
    }
    totalSize += file.size;
  }

  if (totalSize > CSV_LIMITS.maxTotalSizeBytes) {
    throw new CsvProcessingError(
      "TOTAL_SIZE_TOO_LARGE",
      "ファイルの合計サイズが50MBの上限を超えています。",
    );
  }
}
