import { expect, test } from "@playwright/test";
import { imageResizeSpecification } from "../../src/tools/image/resize/spec";

test("仕様確認前は登録せず、承認後にDRAFTと開発パッケージを表示する", async ({ page }) => {
  const specification = { ...imageResizeSpecification, name: "画像一括圧縮", slug: "image-compress" };
  let createRequests = 0;
  await page.route("**/api/admin/product-spec/generate", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ specification }) }));
  await page.route("**/api/admin/products", (route) => { createRequests += 1; return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ productId: "00000000-0000-4000-8000-000000000099", files: { "product-development/image-compress/SPEC.md": "spec" }, checklist: { productSpecification: true, dbDraft: true, registry: false, published: false } }) }); });
  await page.goto("/admin/login");
  await page.getByLabel("パスワード").fill("test-admin-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/products/new");
  await page.getByLabel("商品名 *").fill("画像一括圧縮");
  await page.getByRole("button", { name: "Product Specification初稿を生成" }).click();
  await expect(page.getByLabel("Product Specification")).toContainText("image-compress");
  expect(createRequests).toBe(0);
  await page.getByRole("button", { name: "この仕様で進める" }).click();
  await expect(page.getByRole("heading", { name: "DRAFT登録完了" })).toBeVisible();
  expect(createRequests).toBe(1);
  await expect(page.getByText("未実装 registry")).toBeVisible();
});
