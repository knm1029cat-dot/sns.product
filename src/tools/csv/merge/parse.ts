import Papa from "papaparse";
import { CsvProcessingError } from "./errors";
import type { CsvInputFile, ParsedCsv } from "./types";

const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

export async function parseCsv(file: CsvInputFile): Promise<ParsedCsv> {
  let text: string;
  try {
    text = utf8Decoder.decode(await file.arrayBuffer());
  } catch {
    throw new CsvProcessingError(
      "INVALID_ENCODING",
      `${file.name}はUTF-8として読み込めません。UTF-8形式のCSVをご利用ください。`,
    );
  }

  const normalizedText = text.startsWith("\uFEFF") ? text.slice(1) : text;
  if (normalizedText.length === 0) {
    throw new CsvProcessingError("EMPTY_FILE", `${file.name}は空のファイルです。`);
  }

  const result = Papa.parse<string[]>(normalizedText, {
    skipEmptyLines: "greedy",
    dynamicTyping: false,
  });

  const fatalErrors = result.errors.filter(
    (error) => error.code !== "UndetectableDelimiter",
  );
  if (fatalErrors.length > 0) {
    throw new CsvProcessingError(
      "INVALID_CSV",
      `${file.name}をCSVとして解析できませんでした。`,
    );
  }

  const records = result.data.map((row) => row.map((value) => String(value)));
  const [headers, ...rows] = records;
  if (!headers || headers.length === 0 || headers.every((header) => header === "")) {
    throw new CsvProcessingError(
      "INVALID_CSV",
      `${file.name}に有効なヘッダーがありません。`,
    );
  }

  return { fileName: file.name, headers, rows };
}
