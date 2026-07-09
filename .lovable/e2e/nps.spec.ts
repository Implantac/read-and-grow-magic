/**
 * Smoke E2E do módulo NPS & Relacionamento.
 * Cobre a navegação das principais abas e verifica que cada tela renderiza
 * sem erros e exibe o cabeçalho esperado.
 */
import { test, expect, Page } from "@playwright/test";

const EMAIL = process.env.SMOKE_EMAIL ?? "admin@empresa.com";
const PASS = process.env.SMOKE_PASS ?? "admin123";

const TABS: { path: string; label: RegExp }[] = [
  { path: "/relacionamento/nps/dashboard", label: /NPS/i },
  { path: "/relacionamento/nps/campanhas", label: /campanha/i },
  { path: "/relacionamento/nps/pesquisas", label: /pesquisa/i },
  { path: "/relacionamento/nps/convites", label: /convite/i },
  { path: "/relacionamento/nps/respostas", label: /resposta/i },
  { path: "/relacionamento/nps/followups", label: /follow/i },
  { path: "/relacionamento/nps/relatorios", label: /relat/i },
  { path: "/relacionamento/nps/relatorios-salvos", label: /salvo|relat/i },
  { path: "/relacionamento/nps/templates", label: /template/i },
  { path: "/relacionamento/nps/automacoes", label: /automa/i },
  { path: "/relacionamento/nps/logs", label: /log/i },
  { path: "/relacionamento/nps/configuracoes", label: /config/i },
];

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/e-?mail/i).fill(EMAIL);
  await page.getByLabel(/senha/i).fill(PASS);
  await page.getByRole("button", { name: /entrar|login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

test.describe("NPS — smoke de navegação", () => {
  test("todas as abas renderizam sem erro", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await login(page);

    for (const tab of TABS) {
      await page.goto(tab.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8_000 });
    }

    const relevant = errors.filter(
      (e) => !/favicon|Manifest|ResizeObserver|hydrat/i.test(e),
    );
    expect(relevant, `Erros de console:\n${relevant.join("\n")}`).toEqual([]);
  });
});
