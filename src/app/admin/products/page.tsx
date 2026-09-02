import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { getAdminUser } from "@/lib/auth/session";
import { getAllProductsForAdmin } from "@/features/products/admin-repository";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!(await getAdminUser())) redirect("/admin/login");
  const products = await getAllProductsForAdmin();
  return (
    <main className="container">
      <AdminHeader />
      <h1>商品</h1>
      <p><Link className="button" href="/admin/products/new">新しい商品を追加</Link></p>
      <div className="stack">
        {products.map((product) => (
          <Link className="card" href={`/admin/products/${product.id}`} key={product.id}>
            <span className="badge">{product.status}</span>
            <h2>{product.name}</h2>
            <p className="muted">/{product.slug}・仕様v{product.spec_version}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
