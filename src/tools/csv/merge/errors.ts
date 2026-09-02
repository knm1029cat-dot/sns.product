export type CsvErrorCode =
  | "INVALID_FILE_COUNT"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "TOTAL_SIZE_TOO_LARGE"
  | "EMPTY_FILE"
  | "INVALID_ENCODING"
  | "INVALID_CSV"
  | "HEADER_MISMATCH";

export class CsvProcessingError extends Error {
  constructor(
    public readonly code: CsvErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CsvProcessingError";
  }
}
