/**
 * Onda D — Playwright smoke suite (10 critical flows)
 * Run locally with:  bunx playwright test .lovable/e2e/smoke.ts
 * Requires:          bun add -d @playwright/test  &&  bunx playwright install chromium
 *
 * These tests assume dev server on http://localhost:8080 and a seeded
 * account (admin@empresa.com / admin123) — see mem://core.
 */
import { test, expect, Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:8080";
const EMAIL = process.env.SMOKE_EMAIL ?? "admin@empresa.com";
const PASS = process.env.SMOKE_PASS ?? "admin123";

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel(/e-?mail/i).fill(EMAIL);
  await page.getByLabel(/senha/i).fill(PASS);
  await page.getByRole("button", { name: /entrar|login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

test.describe("USE ERP — Smoke", () => {
  test("1. login page renders", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.getByLabel(/e-?mail/i)).toBeVisible();
  });

  test("2. login redirects to dashboard", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("3. dashboard shows revenue KPI", async ({ page }) => {
    await login(page);
    await expect(page.getByText(/faturamento|receita/i).first()).toBeVisible();
  });

  test("4. sidebar Financeiro starts collapsed", async ({ page }) => {
    await login(page);
    const finItem = page.getByRole("button", { name: /financeiro/i }).first();
    await expect(finItem).toHaveAttribute("aria-expanded", "false");
  });

  test("5. Cmd+K opens command palette", async ({ page }) => {
    await login(page);
    await page.keyboard.press("Meta+K");
    await expect(page.getByPlaceholder(/buscar|pesquisar/i)).toBeVisible();
  });

  test("6. Ctrl+J opens brain drawer", async ({ page }) => {
    await login(page);
    await page.keyboard.press("Control+J");
    await expect(page.getByText(/cérebro|assistente/i).first()).toBeVisible();
  });

  test("7. financeiro/pagar list renders", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/financeiro/pagar`);
    await expect(page.locator("main")).toBeVisible();
  });

  test("8. wms/localizacoes renders hierarchy", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/wms/localizacoes`);
    await expect(page.getByText(/localiza/i).first()).toBeVisible();
  });

  test("9. comercial/pedidos list renders", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/comercial/pedidos`);
    await expect(page.locator("main")).toBeVisible();
  });

  test("10. sre dashboard renders", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/sre`);
    await expect(page.getByText(/observab|slo|incident/i).first()).toBeVisible();
  });
});
