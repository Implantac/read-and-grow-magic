/**
 * Regressão do atalho Cmd/Ctrl+K → CommandPalette.
 * Guarda contra o bug corrigido em src/core/layout/CommandPalette.tsx
 * (listener em capture-phase no window, aceitando 'k'/'K'/'KeyK').
 */
import { test, expect, Page } from "@playwright/test";

const EMAIL = process.env.SMOKE_EMAIL ?? "admin@empresa.com";
const PASS = process.env.SMOKE_PASS ?? "admin123";

const ROUTES = [
  "/dashboard",
  "/admin/super",
  "/admin/metadata",
  "/financeiro/pagar",
  "/wms/localizacoes",
  "/comercial/pedidos",
  "/sre",
];

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/e-?mail/i).fill(EMAIL);
  await page.getByLabel(/senha/i).fill(PASS);
  await page.getByRole("button", { name: /entrar|login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

test.describe("CommandPalette — Cmd/Ctrl+K", () => {
  for (const route of ROUTES) {
    test(`abre em ${route}`, async ({ page }) => {
      await login(page);
      await page.goto(route, { waitUntil: "networkidle" });
      // Garante foco fora de inputs (headless-safe)
      await page.evaluate(() => (document.activeElement as HTMLElement)?.blur?.());
      await page.locator("body").focus();
      await page.keyboard.press("Control+K");
      await expect(
        page.getByPlaceholder(/buscar|pesquisar/i),
      ).toBeVisible({ timeout: 4_000 });
    });
  }
});
