insert into products (
  id, name, slug, category, status, short_description, spec_json, spec_version, published_at
) values (
  '00000000-0000-4000-8000-000000000001',
  'CSV一括結合ツール', 'csv-merge', 'csv', 'DRAFT',
  '同じ列構造の複数CSVを、ブラウザ内で安全に縦結合します。',
  $json${
    "schemaVersion":1,"version":1,"locale":"ja-JP","name":"CSV一括結合ツール","slug":"csv-merge","category":"csv","shortDescription":"同じ列構造の複数CSVを、ブラウザ内で安全に縦結合します。","targetUser":"複数のCSVを手作業で統合している事務担当者","problem":"同じ形式のCSVをコピー＆ペーストでまとめる作業に時間がかかる。","solution":"最大10件のCSVを選択し、列構造を検証して入力順に結合する。","input":{"type":"files","acceptedTypes":[".csv","text/csv"],"multiple":true},"output":{"type":"file","description":"UTF-8 BOM付きの結合CSV"},"processing":{"location":"client","maxFiles":10,"maxFileSizeBytes":10485760,"maxTotalSizeBytes":52428800},"features":["複数CSV選択","列構造検証","縦結合","プレビュー","CSVダウンロード"],"nonFeatures":["列名変換","列の自動補完","Excel対応","文字コード自動判定"],"processingRules":["ファイルの選択順を維持する","空行を無視する","値を文字列として維持する","CSV本体をネットワーク送信しない"],"validationRules":["UTF-8またはUTF-8 BOM付きのみ受け付ける","すべてのヘッダーが完全一致する場合のみ結合する","2件以上10件以下のCSVを受け付ける"],"errorCases":[{"condition":"列構造が一致しない","message":"ファイル間で列構造が異なります。"},{"condition":"UTF-8ではない","message":"UTF-8形式のCSVをご利用ください。"}],"limitations":["Shift-JIS非対応","1ファイル10MBまで","合計50MBまで"],"acceptanceCriteria":["正常なCSVを入力順に結合できる","不一致ヘッダーを結合しない","出力にUTF-8 BOMが付く","CSV本体をサーバーへ送らない"],"testCases":[{"id":"csv-merge-basic","type":"e2e","title":"2件のCSVを結合する","steps":["CSVを2件選択する","結合を実行する","結果をダウンロードする"],"expectedResult":"入力順に結合されたCSVをダウンロードできる。"}],"analytics":{"category":"csv-processing","enabledEvents":["page_view","tool_open","tool_started","tool_completed","download_clicked"]}
  }$json$::jsonb,
  1, null
)
on conflict (id) do nothing;

insert into product_spec_versions(product_id, version, spec_json, created_by)
select id, spec_version, spec_json, null from products
where id = '00000000-0000-4000-8000-000000000001'
on conflict (product_id, version) do nothing;
