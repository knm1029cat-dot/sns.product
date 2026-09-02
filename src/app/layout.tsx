import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tool Factory",
  description: "明確な面倒を簡単に解決する、小さなWebツール集。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <header className="site-header">
          <div className="container site-header-inner">
            <Link href="/"><strong>Tool Factory</strong></Link>
            <nav className="nav" aria-label="メインナビゲーション">
              <Link href="/tools">ツール一覧</Link>
              <Link href="/admin">管理</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
