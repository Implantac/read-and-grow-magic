import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — headless suíte executada em CI.
 * Foco: smoke crítico + regressão do atalho Cmd/Ctrl+K (CommandPalette).
 */
export default defineConfig({
  testDir: ".lovable/e2e",
  testMatch: ["**/*.spec.ts", "**/*.spec.tsx"],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:8080",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev -- --port 8080 --strictPort",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
