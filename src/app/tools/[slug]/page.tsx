import { notFound } from "next/navigation";
import { PageView } from "@/components/analytics/page-view";
import { getPublishedProductBySlug } from "@/features/products/public-repository";
import { toolComponentMap } from "@/tools/component-map";
import { getToolDefinition } from "@/tools/registry";

export const dynamic = "force-dynamic";

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const definition = getToolDefinition(slug);
  const product = await getPublishedProductBySlug(slug);
  if (!definition || !product) notFound();
  const ToolComponent = toolComponentMap[definition.componentKey];
  const spec = product.spec_json;
  return (
    <main className="container">
      <PageView pageType="tool" productId={product.id} />
      <section className="hero">
        <span className="badge">{product.category.toUpperCase()}・サーバー送信なし</span>
        <h1 style={{ fontSize: 48 }}>{product.name}</h1>
        <p className="muted">{product.short_description}</p>
      </section>
      <ToolComponent productId={product.id} />
      <section className="grid" style={{ marginTop: 24 }}>
        <div className="card"><h2>使い方</h2><ol>{definition.usageSteps.map((step) => <li key={step}>{step}</li>)}</ol></div>
        <div className="card"><h2>制限事項</h2><ul>{spec.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </section>
    </main>
  );
}
