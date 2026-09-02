import Papa from "papaparse";
import { UTF8_BOM } from "./constants";
import type { MergedCsv } from "./types";

export function serializeCsv(data: MergedCsv): string {
  const csv = Papa.unparse([data.headers, ...data.rows], {
    newline: "\r\n",
  });
  return `${UTF8_BOM}${csv}`;
}
