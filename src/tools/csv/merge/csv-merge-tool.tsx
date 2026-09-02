"use client";

import { useEffect, useRef, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { CsvProcessingError, processCsvFiles, type CsvProcessingResult } from ".";

function rowCountBucket(count: number): "0" | "1-100" | "101-1000" | "1001+" {
  if (count === 0) return "0";
  if (count <= 100) return "1-100";
  if (count <= 1000) return "101-1000";
  return "1001+";
}

export function CsvMergeTool({ productId }: { productId?: string }) {
  const toolElement = useRef<HTMLElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<CsvProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (toolElement.current) toolElement.current.dataset.ready = "true";
    void trackAnalyticsEvent({ eventName: "tool_open", productId, metadata: { toolSlug: "csv-merge" } });
  }, [productId]);

  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  function selectFiles(selected: FileList | null) {
    setFiles(selected ? Array.from(selected) : []);
    setResult(null);
    setError(null);
    setDownloadUrl(null);
  }

  async function processFiles() {
    setProcessing(true);
    setError(null);
    void trackAnalyticsEvent({ eventName: "tool_started", productId, metadata: { toolSlug: "csv-merge", fileCount: files.length } });
    try {
      const nextResult = await processCsvFiles(files);
      setResult(nextResult);
      const blob = new Blob([nextResult.csv], { type: "text/csv;charset=utf-8" });
      setDownloadUrl(URL.createObjectURL(blob));
      void trackAnalyticsEvent({
        eventName: "tool_completed",
        productId,
        metadata: { toolSlug: "csv-merge", fileCount: files.length, rowCountBucket: rowCountBucket(nextResult.rowCount) },
      });
    } catch (caught) {
      setResult(null);
      setError(caught instanceof CsvProcessingError ? caught.message : "処理できませんでした。ファイル形式や内容をご確認ください。");
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    void trackAnalyticsEvent({ eventName: "download_clicked", productId, metadata: { toolSlug: "csv-merge" } });
  }

  return (
    <section ref={toolElement} className="card stack" aria-labelledby="csv-tool-title" data-testid="csv-merge-tool" data-ready="false">
      <h2 id="csv-tool-title" style={{ margin: 0 }}>CSVファイルを追加</h2>
      <label className="tool-dropzone">
        <span><strong>複数のCSVを選択</strong><br /><span className="muted">2〜10件、各10MB・合計50MBまで</span></span>
        <input data-testid="csv-input" type="file" accept=".csv,text/csv" multiple onChange={(event) => selectFiles(event.target.files)} />
      </label>
      {files.length > 0 && (
        <div>
          <h3>選択中のファイル（{files.length}件）</h3>
          <ul className="file-list">{files.map((file, index) => <li key={`${file.name}-${index}`}>{file.name}（{Math.ceil(file.size / 1024)}KB）</li>)}</ul>
        </div>
      )}
      <button className="button" type="button" disabled={processing || files.length < 2} onClick={processFiles}>
        {processing ? "処理中…" : "CSVを結合する"}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
      {result && (
        <div className="stack" aria-live="polite">
          <h3 style={{ marginBottom: 0 }}>処理結果：{result.rowCount}件</h3>
          <div className="preview">
            <table>
              <thead><tr>{result.headers.map((header, index) => <th key={`${header}-${index}`}>{header}</th>)}</tr></thead>
              <tbody>{result.rows.slice(0, 8).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <a className="button" href={downloadUrl ?? undefined} download="merged.csv" onClick={download}>結合CSVをダウンロード</a>
        </div>
      )}
    </section>
  );
}
