import type { MergedCsv, ParsedCsv } from "./types";

export function mergeCsvFiles(csvFiles: readonly ParsedCsv[]): MergedCsv {
  const headers = [...(csvFiles[0]?.headers ?? [])];
  const rows = csvFiles.flatMap((csvFile) => csvFile.rows.map((row) => [...row]));
  return { headers, rows };
}
