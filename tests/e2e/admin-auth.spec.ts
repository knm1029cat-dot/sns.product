import { expect, test } from "@playwright/test";

test("未認証と偽造sessionでは管理画面へアクセスできない", async ({ page, context }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await context.addCookies([{ name: "tool_factory_admin_session", value: "forged.session", url: "http://127.0.0.1:3000" }]);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("正しいパスワードだけがログインできる", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("パスワード").fill("wrong-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/error=invalid/);
  await page.getByLabel("パスワード").fill("test-admin-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
});
