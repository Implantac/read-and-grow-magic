/**
 * E2E-CORE — Compras (Procure-to-Pay): Fornecedores → Cotações → Pedidos →
 * Aprovações → Recebimento (WMS) → Contas a Pagar.
 * Somente leitura: valida renderização e ausência de erros de runtime.
 */
import { test, expect } from "@playwright/test";
import { login, visit, collectErrors } from "./_helpers";

const CHAIN: Array<{ etapa: string; route: string; marker: RegExp }> = [
  { etapa: "1. Fornecedores", route: "/compras/fornecedores", marker: /fornecedor/i },
  { etapa: "2. Cotações", route: "/compras/cotacoes", marker: /cota[çc]/i },
  { etapa: "3. Pedidos de compra", route: "/compras/pedidos", marker: /pedido/i },
  { etapa: "4. Aprovações", route: "/compras/aprovacoes", marker: /aprova/i },
  { etapa: "5. Indicadores de aprovação (SLA)", route: "/compras/aprovacoes/indicadores", marker: /sla|indicador|aprova/i },
  { etapa: "6. WMS — Recebimento", route: "/wms/recebimento", marker: /recebimento/i },
  { etapa: "7. WMS — Conferência", route: "/wms/conferencia", marker: /confer/i },
  { etapa: "8. Financeiro — Contas a Pagar", route: "/financeiro/pagar", marker: /pagar|títul/i },
];

test.describe("E2E-CORE — Procure to Pay", () => {
  for (const { etapa, route, marker } of CHAIN) {
    test(`${etapa} renderiza sem erro`, async ({ page }) => {
      const errors = collectErrors(page);
      await login(page);
      await visit(page, route);
      await expect(page.getByText(marker).first()).toBeVisible({ timeout: 15_000 });
      expect(errors, `Erros de runtime em ${route}:\n${errors.join("\n")}`).toHaveLength(0);
    });
  }
});
