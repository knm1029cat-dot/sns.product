import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import { CSV_LIMITS, UTF8_BOM } from "@/tools/csv/merge/constants";
import {
  CsvProcessingError,
  mergeCsvFiles,
  parseCsv,
  processCsvFiles,
  serializeCsv,
  validateFiles,
  validateHeaders,
  type CsvInputFile,
  type ParsedCsv,
} from "@/tools/csv/merge";

const encoder = new TextEncoder();

function csvFile(
  name: string,
  content: string | Uint8Array,
  type = "text/csv",
): CsvInputFile {
  const bytes = typeof content === "string" ? encoder.encode(content) : content;
  return {
    name,
    type,
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.slice().buffer,
  };
}

function sizedFile(name: string, size: number, type = "text/csv"): CsvInputFile {
  return { name, size, type, arrayBuffer: async () => new ArrayBuffer(1) };
}

function parsed(fileName: string, headers: string[], rows: string[][] = []): ParsedCsv {
  return { fileName, headers, rows };
}

describe("validateFiles", () => {
  it("accepts 2 and 10 CSV files", () => {
    expect(() => validateFiles([csvFile("a.csv", "a\n1"), csvFile("b.csv", "a\n2")])).not.toThrow();
    expect(() => validateFiles(Array.from({ length: 10 }, (_, i) => csvFile(`${i}.csv`, "a\n1")))).not.toThrow();
  });

  it.each([
    ["CSV以外", [csvFile("a.txt", "a\n1", "text/plain"), csvFile("b.csv", "a\n2")], "INVALID_FILE_TYPE"],
    ["1ファイル", [csvFile("a.csv", "a\n1")], "INVALID_FILE_COUNT"],
    ["10件超過", Array.from({ length: 11 }, (_, i) => csvFile(`${i}.csv`, "a\n1")), "INVALID_FILE_COUNT"],
    ["空ファイル", [csvFile("a.csv", ""), csvFile("b.csv", "a\n2")], "EMPTY_FILE"],
    ["10MB超過", [sizedFile("a.csv", CSV_LIMITS.maxFileSizeBytes + 1), sizedFile("b.csv", 1)], "FILE_TOO_LARGE"],
    ["合計50MB超過", Array.from({ length: 6 }, (_, i) => sizedFile(`${i}.csv`, 9 * 1024 * 1024)), "TOTAL_SIZE_TOO_LARGE"],
  ])("rejects %s", (_label, files, code) => {
    expect(() => validateFiles(files as CsvInputFile[])).toThrowError(
      expect.objectContaining({ code }),
    );
  });

  it("accepts an empty MIME type when the extension is .csv", () => {
    expect(() => validateFiles([csvFile("a.csv", "a\n1", ""), csvFile("b.csv", "a\n2", "")])).not.toThrow();
  });
});

describe("parseCsv", () => {
  it("keeps Japanese, English, numbers and blanks as strings", async () => {
    const result = await parseCsv(csvFile("values.csv", "名前,name,count,note\n山田,Alice,001,"));
    expect(result.rows).toEqual([["山田", "Alice", "001", ""]]);
  });

  it("parses commas, line breaks and escaped quotes inside cells", async () => {
    const result = await parseCsv(csvFile("quoted.csv", 'name,note\nA,"hello, world"\nB,"line1\nline2"\nC,"say ""hi"""'));
    expect(result.rows).toEqual([
      ["A", "hello, world"],
      ["B", "line1\nline2"],
      ["C", 'say "hi"'],
    ]);
  });

  it("accepts UTF-8 BOM, ignores empty lines and accepts headers only", async () => {
    await expect(parseCsv(csvFile("bom.csv", `${UTF8_BOM}name,value\n\nA,1\n`))).resolves.toMatchObject({
      headers: ["name", "value"],
      rows: [["A", "1"]],
    });
    await expect(parseCsv(csvFile("header.csv", "name,value"))).resolves.toMatchObject({ rows: [] });
  });

  it("rejects invalid UTF-8", async () => {
    await expect(parseCsv(csvFile("bad.csv", new Uint8Array([0xff, 0xfe, 0xfd])))).rejects.toMatchObject({
      code: "INVALID_ENCODING",
    });
  });
});

describe("validateHeaders", () => {
  it("accepts exactly matching headers", () => {
    expect(() => validateHeaders([parsed("a.csv", ["name", "sales"]), parsed("b.csv", ["name", "sales"])]))
      .not.toThrow();
  });

  it.each([
    [["name"], "column count"],
    [["sales", "name"], "order"],
    [["name", "amount"], "name"],
    [["Name", "sales"], "case"],
    [[" name", "sales"], "leading space"],
    [["name ", "sales"], "trailing space"],
  ])("rejects a %s mismatch", (headers) => {
    expect(() => validateHeaders([parsed("a.csv", ["name", "sales"]), parsed("b.csv", headers)])).toThrowError(
      expect.objectContaining({ code: "HEADER_MISMATCH" }),
    );
  });
});

describe("merge and serialize", () => {
  it("preserves file and row order without mutating inputs", () => {
    const input = [
      parsed("a.csv", ["name"], [["A"], ["B"]]),
      parsed("empty.csv", ["name"]),
      parsed("b.csv", ["name"], [["C"]]),
    ];
    const snapshot = structuredClone(input);
    expect(mergeCsvFiles(input)).toEqual({ headers: ["name"], rows: [["A"], ["B"], ["C"]] });
    expect(input).toEqual(snapshot);
  });

  it("adds a BOM and creates a reparsable CSV with one header", () => {
    const output = serializeCsv({ headers: ["name", "note"], rows: [["A", "hello, world"]] });
    expect(output.startsWith(UTF8_BOM)).toBe(true);
    expect(Papa.parse(output.slice(1)).data).toEqual([["name", "note"], ["A", "hello, world"]]);
  });

  it("processes 2 and 10 files end-to-end", async () => {
    const two = await processCsvFiles([csvFile("a.csv", "name\nA"), csvFile("b.csv", "name\nB")]);
    expect(two.rowCount).toBe(2);
    const ten = await processCsvFiles(Array.from({ length: 10 }, (_, i) => csvFile(`${i}.csv`, `name\n${i}`)));
    expect(ten.rows.map(([value]) => value)).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });
});

describe("CsvProcessingError", () => {
  it("provides stable error codes", () => {
    const error = new CsvProcessingError("INVALID_CSV", "message");
    expect(error).toMatchObject({ name: "CsvProcessingError", code: "INVALID_CSV" });
  });
});
