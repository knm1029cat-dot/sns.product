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

insert into products (
  id, name, slug, category, status, short_description, spec_json, spec_version, published_at
) values (
  '00000000-0000-4000-8000-000000000002',
  '画像一括リサイズ', 'image-resize', 'image', 'DRAFT',
  '複数のJPEG・PNG・WebP画像を、ブラウザ内でまとめて同じ横幅にリサイズします。',
  $json${
    "schemaVersion":1,"version":1,"locale":"ja-JP","name":"画像一括リサイズ","slug":"image-resize","category":"image","shortDescription":"複数のJPEG・PNG・WebP画像を、ブラウザ内でまとめて同じ横幅にリサイズします。","targetUser":"SNS投稿、ブログ、EC、資料作成などで複数画像のサイズ変更を繰り返す人","problem":"複数画像を1枚ずつ開いてサイズ変更する作業に時間がかかる。","solution":"最大10件の画像を選択し、指定した横幅へ縦横比を維持して一括リサイズする。","input":{"type":"files","acceptedTypes":["image/jpeg","image/png","image/webp"],"multiple":true},"output":{"type":"file","description":"入力形式を維持したリサイズ画像と一括ZIP"},"processing":{"location":"client","maxFiles":10,"maxFileSizeBytes":10485760,"maxTotalSizeBytes":52428800},"features":["複数画像アップロード","横幅指定","縦横比維持","一括リサイズ","結果プレビュー","個別・一括ダウンロード"],"nonFeatures":["出力形式変換","トリミング","拡大禁止オプション","EXIF編集"],"processingRules":["画像の選択順を維持する","元画像より大きい横幅への拡大を許可する","入力画像と同じ形式で出力する","画像本体をネットワーク送信しない"],"validationRules":["JPEG、PNG、WebPのみ受け付ける","2件以上10件以下の画像を受け付ける","横幅は1〜10,000pxの整数とする"],"errorCases":[{"condition":"非対応形式","message":"JPEG、PNG、WebP形式の画像のみ利用できます。"},{"condition":"画像をデコードできない","message":"画像を読み込めませんでした。ファイルが破損していないか確認してください。"}],"limitations":["JPEG・PNG・WebPのみ対応","1ファイル10MBまで","合計50MBまで","横幅10,000pxまで"],"acceptanceCriteria":["複数画像を入力順にリサイズできる","縦横比が維持される","入力形式を維持できる","個別とZIPでダウンロードできる","画像本体をサーバーへ送らない"],"testCases":[{"id":"image-resize-basic","type":"e2e","title":"2件の画像を一括リサイズする","steps":["画像を2件選択する","横幅を指定する","一括処理する","結果をダウンロードする"],"expectedResult":"縦横比と入力形式を維持した画像をダウンロードできる。"}],"analytics":{"category":"image-processing","enabledEvents":["page_view","tool_open","tool_started","tool_completed","download_clicked"]}
  }$json$::jsonb,
  1, null
)
on conflict (id) do nothing;

insert into product_spec_versions(product_id, version, spec_json, created_by)
select id, spec_version, spec_json, null from products
where id = '00000000-0000-4000-8000-000000000002'
on conflict (product_id, version) do nothing;
