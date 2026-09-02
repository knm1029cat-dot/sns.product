import Link from "next/link";
import { PageView } from "@/components/analytics/page-view";
import { getPublishedProducts } from "@/features/products/public-repository";
import { getToolDefinition } from "@/tools/registry";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const products = (await getPublishedProducts()).filter((product) => getToolDefinition(product.slug));
  return (
    <main className="container">
      <PageView pageType="tools" />
      <section className="hero">
        <h1 style={{ fontSize: 44 }}>公開ツール</h1>
        <p className="muted">ファイルは原則としてブラウザ内で処理します。</p>
      </section>
      {products.length === 0 ? (
        <div className="card">現在公開中のツールはありません。</div>
      ) : (
        <div className="grid">
          {products.map((product) => (
            <Link className="card stack" href={`/tools/${product.slug}`} key={product.id}>
              <span className="badge">{product.category.toUpperCase()}</span>
              <h2 style={{ margin: 0 }}>{product.name}</h2>
              <p className="muted" style={{ margin: 0 }}>{product.short_description}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
