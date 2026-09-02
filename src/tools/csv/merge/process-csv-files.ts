import { mergeCsvFiles } from "./merge";
import { parseCsv } from "./parse";
import { serializeCsv } from "./serialize";
import type { CsvInputFile, CsvProcessingResult } from "./types";
import { validateFiles } from "./validate-files";
import { validateHeaders } from "./validate-headers";

export async function processCsvFiles(
  files: readonly CsvInputFile[],
): Promise<CsvProcessingResult> {
  validateFiles(files);
  const parsed = await Promise.all(files.map(parseCsv));
  validateHeaders(parsed);
  const merged = mergeCsvFiles(parsed);
  return {
    ...merged,
    csv: serializeCsv(merged),
    rowCount: merged.rows.length,
  };
}
