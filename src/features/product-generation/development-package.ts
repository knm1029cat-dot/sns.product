import type { ProductSpecification } from "@/schemas/product-spec";
import type { RegistryCandidate } from "./registry-candidate";

export type DevelopmentPackage = Record<string, string>;
const list = (values: readonly string[]) => values.map((value) => `- ${value}`).join("\n");

export function createDevelopmentPackage(spec: ProductSpecification, productId: string, registry: RegistryCandidate, generatedAt = new Date().toISOString()): DevelopmentPackage {
  const root = `product-development/${spec.slug}`;
  const accepted = registry.acceptedFileTypes.length ? registry.acceptedFileTypes.join(", ") : "なし";
  return {
    [`${root}/SPEC.md`]: `# ${spec.name}\n\n- slug: ${spec.slug}\n- category: ${spec.category}\n- 対象ユーザー: ${spec.targetUser}\n- 問題: ${spec.problem}\n- 解決方法: ${spec.solution}\n- 入力: ${spec.input.type} (${accepted})\n- 出力: ${spec.output.type} — ${spec.output.description}\n- 処理場所: ${spec.processing.location}\n\n## 機能\n${list(spec.features)}\n\n## 非機能\n${list(spec.nonFeatures)}\n\n## Validation\n${list(spec.validationRules)}\n\n## Error cases\n${spec.errorCases.map((item) => `- ${item.condition}: ${item.message}`).join("\n")}\n\n## Limitations\n${list(spec.limitations)}\n\n## Acceptance criteria\n${list(spec.acceptanceCriteria)}\n\n## Analytics events\n${list(spec.analytics.enabledEvents)}\n`,
    [`${root}/IMPLEMENTATION.md`]: `# ${spec.name} 実装指示\n\n- 既存機能を壊さない。\n- Product Specification外の機能を追加しない。\n- 既存共通UIを優先して再利用する。\n- Client-side処理可能ならServerへ送信しない。\n- Analyticsへファイル本体や個人情報を送信しない。\n- 新規依存は必要最低限にする。\n- TypeScript、lint、test、buildをすべて成功させる。\n- 自動公開しない。\n\n## フォルダ構成案\n\`\`\`\nsrc/tools/${spec.category}/${spec.slug}/\n├── ${spec.slug}-tool.tsx\n├── spec.ts\n├── types.ts\n├── errors.ts\n├── process.ts\n└── index.ts\n\`\`\`\n\n不要なファイルは作成しないこと。\n`,
    [`${root}/REGISTRY_PATCH.md`]: `# Registry変更指示\n\n- ToolComponentKeyへ \`${registry.componentKey}\` を追加\n- slug: \`${registry.slug}\`\n- name: \`${registry.name}\`\n- category: \`${registry.category}\`\n- acceptedFileTypes: \`${accepted}\`\n- component mapへ \`${registry.componentKey}\` を追加\n- \`@/tools/${spec.category}/${spec.slug}/${spec.slug}-tool\` から必要なComponentをimport\n\nReact ComponentはDBへ保存しないこと。\n`,
    [`${root}/TEST_CASES.md`]: `# Test候補\n\n## Unit Test候補\n${list(["正常入力", "境界値", "上限", "不正入力", "対応外形式", "入力順", "出力", "元データ非破壊", "Analytics漏洩防止", ...spec.testCases.filter((test) => test.type === "unit").map((test) => test.title)])}\n\n## Component Test候補\n${list(["入力", "エラー表示", "正常完了", "プレビュー", "ダウンロード"])}\n\n## E2E候補\n- 正常系: ${spec.testCases[0]?.title ?? "主要経路を完了できる"}\n- 異常系: ${spec.errorCases[0]?.condition ?? "不正入力を拒否する"}\n`,
    [`${root}/QA_CHECKLIST.md`]: `# QA Checklist\n\n${list(["実ファイルで正常動作", "エラー文言", "スマホ表示", "大きめファイル", "Network送信内容", "Download結果", "ブラウザ差異", ...spec.acceptanceCriteria])}\n`,
    [`${root}/PRODUCT_META.json`]: JSON.stringify({ productId, specVersion: spec.version, schemaVersion: spec.schemaVersion, slug: spec.slug, category: spec.category, componentKey: registry.componentKey, generatedAt, acceptanceCriteria: spec.acceptanceCriteria, enabledAnalyticsEvents: spec.analytics.enabledEvents }, null, 2),
  };
}

export function createProductChecklist(spec: ProductSpecification) {
  void spec;
  return { productSpecification: true, dbDraft: true, registry: false, component: false, unitTest: false, componentTest: false, e2e: false, manualQa: false, published: false };
}
