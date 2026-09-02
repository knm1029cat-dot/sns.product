import Link from "next/link";
import { PageView } from "@/components/analytics/page-view";

export default function HomePage() {
  return (
    <main>
      <PageView pageType="home" />
      <section className="hero">
        <div className="container">
          <span className="badge">ブラウザで完結</span>
          <h1>面倒な作業を、ひとつずつ軽くする。</h1>
          <p className="muted">Tool Factoryは、明確な面倒を簡単に解決する小さなWebツール集です。</p>
          <div style={{ marginTop: 28 }}><Link className="button" href="/tools">ツールを見る</Link></div>
        </div>
      </section>
    </main>
  );
}
