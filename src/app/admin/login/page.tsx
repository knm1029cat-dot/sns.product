import { redirect } from "next/navigation";
import { login } from "@/features/auth/actions";
import { getAdminUser } from "@/lib/auth/session";
import { isAdminAuthConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdminUser()) redirect("/admin");
  const { error } = await searchParams;
  const configured = isAdminAuthConfigured();
  return (
    <main className="container" style={{ maxWidth: 520, paddingTop: 64 }}>
      <div className="card stack">
        <h1 style={{ margin: 0 }}>管理者ログイン</h1>
        {!configured && <p className="error">管理者認証が未設定です。.env.localを設定してください。</p>}
        {error && <p className="error">メールアドレスまたはパスワードを確認してください。</p>}
        <form className="stack" action={login}>
          <label className="form-field">パスワード<input name="password" type="password" autoComplete="current-password" required disabled={!configured} /></label>
          <button className="button" type="submit" disabled={!configured}>ログイン</button>
        </form>
      </div>
    </main>
  );
}
