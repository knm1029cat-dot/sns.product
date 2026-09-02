import { expect, test } from "@playwright/test";

test("CSVを結合し、プレビューしてダウンロードできる", async ({ page }) => {
  await page.route("**/api/analytics/events", (route) => route.fulfill({ status: 204 }));
  await page.goto("/tools/csv-merge");
  await expect(page.getByTestId("csv-merge-tool")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("csv-input").setInputFiles([
    { name: "January.csv", mimeType: "text/csv", buffer: Buffer.from("name,sales\nA,100\nB,200") },
    { name: "February.csv", mimeType: "text/csv", buffer: Buffer.from("name,sales\nC,300") },
  ]);
  await expect(page.getByText("選択中のファイル（2件）")).toBeVisible();
  await page.getByRole("button", { name: "CSVを結合する" }).click();
  await expect(page.getByText("処理結果：3件")).toBeVisible();
  await expect(page.getByRole("cell", { name: "A" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "結合CSVをダウンロード" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("merged.csv");
});

test("列順が違うCSVは結合しない", async ({ page }) => {
  await page.route("**/api/analytics/events", (route) => route.fulfill({ status: 204 }));
  await page.goto("/tools/csv-merge");
  await expect(page.getByTestId("csv-merge-tool")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("csv-input").setInputFiles([
    { name: "a.csv", mimeType: "text/csv", buffer: Buffer.from("name,sales\nA,100") },
    { name: "b.csv", mimeType: "text/csv", buffer: Buffer.from("sales,name\n200,B") },
  ]);
  await page.getByRole("button", { name: "CSVを結合する" }).click();
  await expect(page.locator("p.error[role='alert']")).toContainText("列構造");
  await expect(page.getByRole("link", { name: "結合CSVをダウンロード" })).toHaveCount(0);
});

test("日本語・引用セル・非UTF-8・通信内容・出力BOMを確認する", async ({ page }) => {
  const requestBodies: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") requestBodies.push(request.postData() ?? "");
  });
  await page.goto("/tools/csv-merge");
  await expect(page.getByTestId("csv-merge-tool")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("csv-input").setInputFiles([
    {
      name: "qa-secret-file.csv",
      mimeType: "text/csv",
      buffer: Buffer.from('name,note\n山田,"カンマ,を含む"\n佐藤,"1行目\n2行目"'),
    },
    { name: "header-only.csv", mimeType: "text/csv", buffer: Buffer.from("name,note") },
  ]);
  await page.getByRole("button", { name: "CSVを結合する" }).click();
  await expect(page.getByText("処理結果：2件")).toBeVisible();
  await expect(page.getByRole("cell", { name: "カンマ,を含む" })).toBeVisible();
  await expect(page.getByRole("cell", { name: /1行目/ })).toContainText("2行目");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "結合CSVをダウンロード" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const output = Buffer.concat(chunks);
  expect([...output.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  expect(output.toString("utf8").indexOf("山田")).toBeLessThan(output.toString("utf8").indexOf("佐藤"));

  await page.waitForTimeout(500);
  const transmitted = requestBodies.join("\n");
  expect(transmitted).not.toContain("qa-secret-file.csv");
  expect(transmitted).not.toContain("name,note");
  expect(transmitted).not.toContain("山田");
  expect(transmitted).not.toContain("カンマ,を含む");

  await page.getByTestId("csv-input").setInputFiles([
    { name: "valid.csv", mimeType: "text/csv", buffer: Buffer.from("name,note\nA,ok") },
    { name: "non-utf8.csv", mimeType: "text/csv", buffer: Buffer.from([0xff, 0xfe, 0xfd]) },
  ]);
  await page.getByRole("button", { name: "CSVを結合する" }).click();
  await expect(page.locator("p.error[role='alert']")).toContainText("UTF-8");
});
