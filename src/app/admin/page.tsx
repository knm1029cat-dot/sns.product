import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { getAdminUser } from "@/lib/auth/session";
import { getAllProductsForAdmin } from "@/features/products/admin-repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await getAdminUser())) redirect("/admin/login");
  const products = await getAllProductsForAdmin();
  return (
    <main className="container">
      <AdminHeader />
      <section className="hero" style={{ paddingTop: 28 }}><h1 style={{ fontSize: 42 }}>ダッシュボード</h1></section>
      <div className="grid">
        <Link className="card" href="/admin/products"><span className="muted">商品数</span><div style={{ fontSize: 36, fontWeight: 800 }}>{products.length}</div></Link>
        <div className="card"><span className="muted">公開中</span><div style={{ fontSize: 36, fontWeight: 800 }}>{products.filter(({ status }) => status === "PUBLISHED").length}</div></div>
      </div>
    </main>
  );
}
