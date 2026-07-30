/**
 * E2E-CORE — Commerce B2C: gestão de lojas (autenticado) e vitrine pública
 * (anônima: busca → produto → checkout). O spec público só roda quando a env
 * STOREFRONT_SLUG estiver definida, pois depende de uma loja publicada.
 */
import { test, expect } from "@playwright/test";
import { login, visit, collectErrors } from "./_helpers";

const SLUG = process.env.STOREFRONT_SLUG;

test.describe("E2E-CORE — Commerce (backoffice)", () => {
  const ROUTES: Array<{ etapa: string; route: string; marker: RegExp }> = [
    { etapa: "1. Lojas", route: "/commerce/lojas", marker: /loja/i },
    { etapa: "2. Nova loja", route: "/commerce/lojas/nova", marker: /loja|criar|nova/i },
    { etapa: "3. Marketplace de plugins", route: "/marketplace", marker: /plugin|marketplace|aplicativo/i },
  ];

  for (const { etapa, route, marker } of ROUTES) {
    test(`${etapa} renderiza sem erro`, async ({ page }) => {
      const errors = collectErrors(page);
      await login(page);
      await visit(page, route);
      await expect(page.getByText(marker).first()).toBeVisible({ timeout: 15_000 });
      expect(errors, `Erros de runtime em ${route}:\n${errors.join("\n")}`).toHaveLength(0);
    });
  }
});

test.describe("E2E-CORE — Vitrine pública (anônima)", () => {
  test.skip(!SLUG, "Defina STOREFRONT_SLUG para rodar o fluxo público de checkout.");

  test("vitrine → busca → checkout acessíveis sem login", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`/loja/${SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();

    await page.goto(`/loja/${SLUG}/busca`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("searchbox").or(page.getByPlaceholder(/buscar/i)).first())
      .toBeVisible({ timeout: 15_000 });

    await page.goto(`/loja/${SLUG}/checkout`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/checkout|carrinho|finalizar/i).first())
      .toBeVisible({ timeout: 15_000 });

    expect(errors, `Erros na vitrine pública:\n${errors.join("\n")}`).toHaveLength(0);
  });
});
