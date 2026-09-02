"use client";

import { useState } from "react";
import { strToU8, zipSync } from "fflate";

type PackageResponse = { productId: string; files: Record<string, string>; checklist: Record<string, boolean> };

export function NewProductForm() {
  const [specification, setSpecification] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<PackageResponse | null>(null);

  async function generate(formData: FormData) {
    setBusy(true); setError(""); setCreated(null); setHasDraft(false);
    const input = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
    if (!input.category) delete input.category;
    try {
      const response = await fetch("/api/admin/product-spec/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
      const body = await response.json() as { specification?: unknown; error?: string };
      if (!response.ok || !body.specification) throw new Error(body.error ?? "生成に失敗しました。");
      setSpecification(JSON.stringify(body.specification, null, 2));
      setHasDraft(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "生成に失敗しました。"); }
    finally { setBusy(false); }
  }

  async function approve() {
    setBusy(true); setError("");
    try {
      let parsed: unknown;
      try { parsed = JSON.parse(specification); } catch { throw new Error("Product Specificationを有効なJSONに修正してください。"); }
      const response = await fetch("/api/admin/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed) });
      const body = await response.json() as PackageResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "登録に失敗しました。");
      setCreated(body);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "登録に失敗しました。"); }
    finally { setBusy(false); }
  }

  function downloadPackage() {
    if (!created) return;
    const entries = Object.fromEntries(Object.entries(created.files).map(([name, content]) => [name, strToU8(content)]));
    const url = URL.createObjectURL(new Blob([zipSync(entries)], { type: "application/zip" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "product-development.zip"; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="stack">
    <form className="card stack" action={generate}>
      <h1 style={{ margin: 0 }}>新しい商品アイデア</h1>
      <p className="muted">商品名だけでも生成できます。AIへファイル本体を送信する入力欄はありません。</p>
      <label className="form-field"><span>商品名 *</span><input name="name" required /></label>
      <label className="form-field"><span>一言でどんなツールか</span><input name="shortDescription" /></label>
      <label className="form-field"><span>category</span><select name="category" defaultValue=""><option value="">AIに提案させる</option>{["csv","excel","image","file","text","sns","ai"].map((value) => <option key={value}>{value}</option>)}</select></label>
      {[["targetUser","対象ユーザー"],["problem","解決する課題"],["input","入力"],["output","出力"],["features","必要と思う機能"],["notes","メモ"]].map(([name,label]) => <label className="form-field" key={name}><span>{label}</span><textarea name={name} rows={2} /></label>)}
      <button className="button" disabled={busy}>{busy ? "生成中…" : "Product Specification初稿を生成"}</button>
    </form>
    {error && <p className="error" role="alert">{error}</p>}
    {hasDraft && !created && <section className="card stack"><h2>Product Specification確認</h2><p className="muted">内容を修正できます。確定するまでDB登録されません。</p><textarea aria-label="Product Specification" value={specification} onChange={(event) => setSpecification(event.target.value)} rows={32} className="code-editor" /><button className="button" type="button" disabled={busy} onClick={approve}>この仕様で進める</button></section>}
    {created && <section className="card stack" aria-live="polite"><h2>DRAFT登録完了</h2><p>商品ID：{created.productId}</p><ul>{Object.entries(created.checklist).map(([item, done]) => <li key={item}>{done ? "✓" : "未実装"} {item}</li>)}</ul><button className="button" type="button" onClick={downloadPackage}>開発パッケージをダウンロード</button></section>}
  </div>;
}
