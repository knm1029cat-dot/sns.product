"use client";

import { useEffect, useRef, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { createImagesZip, ImageResizeError, processImages, type ImageResizeResult } from ".";

type PreviewResult = ImageResizeResult & { url: string };

export function ImageResizeTool({ productId }: { productId?: string }) {
  const toolElement = useRef<HTMLElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [targetWidth, setTargetWidth] = useState("1200");
  const [results, setResults] = useState<PreviewResult[]>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (toolElement.current) toolElement.current.dataset.ready = "true";
    void trackAnalyticsEvent({ eventName: "tool_open", productId, metadata: { toolSlug: "image-resize" } });
  }, [productId]);

  useEffect(() => () => {
    results.forEach(({ url }) => URL.revokeObjectURL(url));
    if (zipUrl) URL.revokeObjectURL(zipUrl);
  }, [results, zipUrl]);

  function resetOutputs() {
    setResults([]);
    setZipUrl(null);
  }

  function selectFiles(selected: FileList | null) {
    setFiles(selected ? Array.from(selected) : []);
    resetOutputs();
    setError(null);
  }

  async function resizeAll() {
    setProcessing(true);
    setError(null);
    resetOutputs();
    void trackAnalyticsEvent({ eventName: "tool_started", productId, metadata: { toolSlug: "image-resize", fileCount: files.length } });
    try {
      const resized = await processImages(files, Number(targetWidth));
      const previews = resized.map((result) => ({ ...result, url: URL.createObjectURL(result.blob) }));
      setResults(previews);
      setZipUrl(URL.createObjectURL(await createImagesZip(resized)));
      void trackAnalyticsEvent({
        eventName: "tool_completed", productId,
        metadata: { toolSlug: "image-resize", fileCount: files.length, outputCount: resized.length },
      });
    } catch (caught) {
      setError(caught instanceof ImageResizeError ? caught.message : "画像を処理できませんでした。ファイル形式や内容をご確認ください。");
    } finally {
      setProcessing(false);
    }
  }

  function trackDownload() {
    void trackAnalyticsEvent({ eventName: "download_clicked", productId, metadata: { toolSlug: "image-resize" } });
  }

  return (
    <section ref={toolElement} className="card stack" aria-labelledby="image-tool-title" data-testid="image-resize-tool" data-ready="false">
      <h2 id="image-tool-title" style={{ margin: 0 }}>画像を追加</h2>
      <label className="tool-dropzone">
        <span><strong>複数の画像を選択</strong><br /><span className="muted">JPEG・PNG・WebP、2〜10件、各10MB・合計50MBまで</span></span>
        <input data-testid="image-input" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple onChange={(event) => selectFiles(event.target.files)} />
      </label>
      {files.length > 0 && <div><h3>選択中の画像（{files.length}件）</h3><ul className="file-list">{files.map((file, index) => <li key={`${file.name}-${index}`}>{file.name}（{Math.ceil(file.size / 1024)}KB）</li>)}</ul></div>}
      <label className="form-field">
        <span>出力する横幅（px）</span>
        <input aria-label="出力する横幅" type="number" min="1" max="10000" step="1" value={targetWidth} onChange={(event) => { setTargetWidth(event.target.value); resetOutputs(); setError(null); }} />
        <span className="muted">縦横比を維持します。元画像より大きい横幅も指定できます。</span>
      </label>
      <button className="button" type="button" disabled={processing || files.length < 2} onClick={resizeAll}>{processing ? "処理中…" : "画像を一括リサイズ"}</button>
      {error && <p className="error" role="alert">{error}</p>}
      {results.length > 0 && (
        <div className="stack" aria-live="polite">
          <h3 style={{ marginBottom: 0 }}>処理完了：{results.length}件</h3>
          <div className="image-result-grid">
            {results.map((result) => (
              <article className="image-result" key={result.outputName}>
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URLs are generated entirely in the browser. */}
                <img src={result.url} alt={`${result.outputName}のプレビュー`} />
                <strong>{result.outputName}</strong>
                <span className="muted">{result.originalWidth} × {result.originalHeight} → {result.width} × {result.height}</span>
                <a className="button button-secondary" href={result.url} download={result.outputName} onClick={trackDownload}>個別ダウンロード</a>
              </article>
            ))}
          </div>
          <a className="button" href={zipUrl ?? undefined} download="image-resize-results.zip" onClick={trackDownload}>すべてZIPでダウンロード</a>
        </div>
      )}
    </section>
  );
}
