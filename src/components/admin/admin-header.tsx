import Link from "next/link";
import { logout } from "@/features/auth/actions";

export function AdminHeader() {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "24px 0" }}>
      <nav className="nav"><Link href="/admin"><strong>管理画面</strong></Link><Link href="/admin/products">商品</Link></nav>
      <form action={logout}><button className="button button-secondary" type="submit">ログアウト</button></form>
    </div>
  );
}
