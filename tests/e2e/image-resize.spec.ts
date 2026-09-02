import { expect, test } from "@playwright/test";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

test("画像2枚を一括リサイズし、画像本文を送信せずダウンロードできる", async ({ page }) => {
  const requestBodies: string[] = [];
  page.on("request", (request) => { if (request.method() !== "GET") requestBodies.push(request.postData() ?? ""); });
  await page.goto("/tools/image-resize");
  await expect(page.getByTestId("image-resize-tool")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("image-input").setInputFiles([
    { name: "private-first.png", mimeType: "image/png", buffer: png },
    { name: "private-second.png", mimeType: "image/png", buffer: png },
  ]);
  await expect(page.getByText("選択中の画像（2件）")).toBeVisible();
  await page.getByLabel("出力する横幅").fill("1200");
  await page.getByRole("button", { name: "画像を一括リサイズ" }).click();
  await expect(page.getByText("処理完了：2件")).toBeVisible();
  await expect(page.getByTestId("image-resize-tool").getByRole("img")).toHaveCount(2);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "すべてZIPでダウンロード" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("image-resize-results.zip");
  await page.waitForTimeout(300);
  const transmitted = requestBodies.join("\n");
  expect(transmitted).not.toContain("private-first.png");
  expect(transmitted).not.toContain("private-second.png");
  expect(transmitted).not.toContain(png.toString("base64"));
});
