import { notFound, redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { publishProduct, saveProductSpecificationForm } from "@/features/products/actions";
import { getAdminUser } from "@/lib/auth/session";
import { getAdminProduct } from "@/features/products/admin-repository";
import { getToolDefinition } from "@/tools/registry";

export const dynamic = "force-dynamic";

export default async function AdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUser())) redirect("/admin/login");
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();
  const registryExists = Boolean(getToolDefinition(product.slug));
  const saveAction = saveProductSpecificationForm.bind(null, product.id);
  const publishAction = publishProduct.bind(null, product.id);
  return (
    <main className="container">
      <AdminHeader />
      <div className="stack">
        <div className="card">
          <span className="badge">{product.status}</span>
          <h1>{product.name}</h1>
          <p className="muted">/{product.slug}・仕様v{product.spec_version}・Registry {registryExists ? "登録済み" : "未登録"}</p>
          {product.status === "DRAFT" && (
            <form action={publishAction}>
              <button className="button" type="submit" disabled={!registryExists}>公開する</button>
            </form>
          )}
          {product.status === "PUBLISHED" && <p>公開日時：{product.published_at}</p>}
        </div>
        <form className="card stack" action={saveAction}>
          <div><h2 style={{ marginBottom: 4 }}>Product Specification</h2><p className="muted">保存時にZod検証、履歴追加、投影カラム更新を1つのDBトランザクションで行います。</p></div>
          <textarea name="specification" defaultValue={JSON.stringify(product.spec_json, null, 2)} rows={28} style={{ width: "100%", fontFamily: "monospace", padding: 12, border: "1px solid var(--border)", borderRadius: 10 }} />
          <button className="button" type="submit">仕様を保存</button>
        </form>
      </div>
    </main>
  );
}
