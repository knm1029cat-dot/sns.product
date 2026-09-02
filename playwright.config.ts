import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: externalBaseUrl ?? "http://127.0.0.1:3000", trace: "on-first-retry" },
  webServer: externalBaseUrl ? undefined : {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      TOOL_FACTORY_DEMO_DATA: "true",
      ADMIN_PASSWORD_HASH: "\\$2b\\$10\\$ixMjI1CuDe7g7LW0DtSXz.cbxlovk5M/lrZ4wy8Zg2E/72O9Lfgja",
      SESSION_SECRET: "playwright-only-session-secret-32-bytes-minimum",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
