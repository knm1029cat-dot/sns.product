export type CsvInputFile = Pick<File, "name" | "size" | "type" | "arrayBuffer">;

export type ParsedCsv = {
  fileName: string;
  headers: string[];
  rows: string[][];
};

export type MergedCsv = {
  headers: string[];
  rows: string[][];
};

export type CsvProcessingResult = MergedCsv & {
  csv: string;
  rowCount: number;
};
