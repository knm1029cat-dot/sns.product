# Tool Factory MVP

小型Webツールを共通基盤へ追加する縦切りMVPです。第一号商品として、完全Client-sideのCSV一括結合ツールを実装しています。

## 構成

- Next.js / React / TypeScript / Tailwind CSS
- Neon Postgres（ORMなし、`@neondatabase/serverless`）
- bcrypt hashとHMAC署名済みHttpOnly Cookieによる1人管理者認証
- Zod、Papa Parse、Vitest、Testing Library、Playwright

CSV本体、ファイル名、セル、ヘッダーはサーバー・Neon・Analyticsへ送信しません。

## Neonプロジェクトと環境変数

1. Neon ConsoleでProjectを作成します。
2. DashboardのConnectから`sslmode=require`を含む接続文字列を取得します。
3. `Copy-Item .env.example .env.local`を実行します。
4. `.env.local`へ次を設定します。

```dotenv
DATABASE_URL=postgresql://...
ADMIN_PASSWORD_HASH=...
SESSION_SECRET=...
```

秘密情報を`NEXT_PUBLIC_`変数へ入れないでください。

### ADMIN_PASSWORD_HASH生成

次のコマンドはパスワードを対話入力し、bcrypt hashだけを出力します。

```powershell
node -e "const b=require('bcryptjs'),r=require('readline').createInterface({input:process.stdin,output:process.stdout});r.question('Admin password: ',p=>{console.log(b.hashSync(p,12));r.close()})"
```

出力された`$2b$...`を設定します。平文パスワードは保存しません。

### SESSION_SECRET生成

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

管理者パスワードとは別の値を使用してください。

## Migrationとseed

Neon ConsoleのSQL Editorで次の順に実行します。

1. `database/migrations/001_initial_schema.sql`
2. `database/seed.sql`

`psql`を利用できる場合：

```powershell
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f database/migrations/001_initial_schema.sql
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f database/seed.sql
```

seed商品は`DRAFT`で作成されます。

## ローカル起動

```powershell
npm install
npm run dev
```

- 公開画面：`http://localhost:3000/tools`
- 管理者ログイン：`http://localhost:3000/admin/login`

DB未接続でCSV画面だけを確認する場合、ローカルで`TOOL_FACTORY_DEMO_DATA=true`を設定できます。本番では使用しないでください。

## 管理者認証

入力パスワードをサーバー側でbcrypt hashと比較します。成功時だけHMAC-SHA256署名、有効期限、nonceを持つセッションをCookieへ保存します。

- HttpOnly
- Secure（production）
- SameSite=Strict
- Path=/
- 12時間有効

管理ページと管理Server Actionは、Cookieの存在ではなく署名と期限を検証します。

## Product Specification transaction

Product SpecificationがSingle Source of Truthです。Zod検証後、1つのPostgreSQL transaction内で次を実行します。

1. 対象商品を`FOR UPDATE`でlock
2. `spec_version`採番
3. `spec_json`更新
4. `name`、`slug`、`category`、`short_description`を仕様から投影
5. `product_spec_versions`へ履歴追加

途中で失敗するとrollbackされます。投影カラムをUIから個別更新する経路はありません。

## 公開条件

管理者が「公開する」を押した場合だけ、transaction内で管理者セッション、仕様、slug、Registry、現在の`DRAFT`状態を確認します。成功時に`PUBLISHED`と`published_at`を設定します。Vercel deploymentは実行しません。

公開RepositoryはSQLで`PUBLISHED`だけを取得し、さらにRegistry実装の存在を確認します。管理Repositoryとは分離されています。

## Analytics

ブラウザは`POST /api/analytics/events`だけを使用します。固定Zod schemaを検証後、parameterized queryでNeonへ保存します。

許可イベントは`page_view`、`tool_open`、`tool_started`、`tool_completed`、`download_clicked`です。任意metadata、CSV内容、ヘッダー、ファイル名、File、Blob、個人情報、Secretは拒否します。

## CSV仕様

- UTF-8 / UTF-8 BOM、fatal UTF-8 decoder
- 2～10ファイル、各10MB、合計50MB
- ヘッダーの列数・列名・列順・大文字小文字・前後空白を完全比較
- 空行無視、ヘッダーのみCSV許可
- 値は文字列として維持
- UTF-8 BOM付き出力

## テスト

```powershell
npm run typecheck
npm run lint
npm run test:unit
npm run test:component
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit Testはmock DBでtransaction、rollback、公開Query、Analyticsを検証します。Neon実接続と実DB制約は、接続先へmigrationを適用した後に別途確認してください。

## Vercel設定

Vercel ProjectのSettings > Environment Variablesへ`DATABASE_URL`、`ADMIN_PASSWORD_HASH`、`SESSION_SECRET`を登録し、対象環境を選択して再deployします。値をソースコード、README、公開ログへ貼り付けないでください。
