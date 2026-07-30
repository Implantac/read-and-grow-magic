/**
 * Helpers compartilhados da suíte E2E.
 * Centraliza login, guarda de erros de runtime e navegação assertiva,
 * evitando duplicação entre os specs de fluxo crítico.
 */
import { expect, Page } from "@playwright/test";

export const EMAIL = process.env.SMOKE_EMAIL ?? "admin@empresa.com";
export const PASS = process.env.SMOKE_PASS ?? "admin123";

/** Faz login e aguarda o dashboard. */
export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/e-?mail/i).fill(EMAIL);
  await page.getByLabel(/senha/i).fill(PASS);
  await page.getByRole("button", { name: /entrar|login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

/**
 * Coleta erros de console/página. Ignora ruído conhecido de terceiros
 * (favicon, extensões, avisos de dev do React Router).
 */
const IGNORED = [
  /favicon/i,
  /ResizeObserver loop/i,
  /React Router Future Flag/i,
  /Download the React DevTools/i,
  /net::ERR_(ABORTED|BLOCKED)/i,
];

export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  const push = (msg: string) => {
    if (!IGNORED.some((re) => re.test(msg))) errors.push(msg);
  };
  page.on("console", (m) => {
    if (m.type() === "error") push(m.text());
  });
  page.on("pageerror", (e) => push(e.message));
  return errors;
}

/**
 * Abre uma rota autenticada e garante que a tela renderizou:
 * sem tela de erro (ErrorBoundary), sem 404 e com <main> visível.
 */
export async function visit(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main, [role='main']").first()).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByText(/algo deu errado|erro inesperado|página não encontrada/i),
  ).toHaveCount(0);
}
