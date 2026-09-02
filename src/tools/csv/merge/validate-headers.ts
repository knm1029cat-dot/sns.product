import { CsvProcessingError } from "./errors";
import type { ParsedCsv } from "./types";

export function validateHeaders(csvFiles: readonly ParsedCsv[]): void {
  const reference = csvFiles[0];
  if (!reference) return;

  for (const csvFile of csvFiles.slice(1)) {
    const matches =
      csvFile.headers.length === reference.headers.length &&
      csvFile.headers.every((header, index) => header === reference.headers[index]);

    if (!matches) {
      throw new CsvProcessingError(
        "HEADER_MISMATCH",
        `${csvFile.fileName}の列構造が${reference.fileName}と異なります。列名・列順・大文字小文字・前後空白を揃えてください。`,
      );
    }
  }
}
