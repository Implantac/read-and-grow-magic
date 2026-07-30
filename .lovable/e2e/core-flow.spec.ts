/**
 * E2E-CORE — fluxo do dinheiro: Pedido → WMS → Fiscal → Financeiro → Estoque.
 * Teste de regressão de renderização + ausência de erros de runtime em cada
 * etapa da cadeia. Não muta dados (seguro para rodar em ambiente compartilhado).
 */
import { test, expect } from "@playwright/test";
import { login, visit, collectErrors } from "./_helpers";

/** Cada etapa do ciclo Order-to-Cash, na ordem cronológica real. */
const CHAIN: Array<{ etapa: string; route: string; marker: RegExp }> = [
  { etapa: "1. Comercial — Pedidos", route: "/comercial/pedidos", marker: /pedido/i },
  { etapa: "2. Comercial — Monitor O2C", route: "/comercial/o2c-monitor", marker: /o2c|monitor|pedido/i },
  { etapa: "3. WMS — Separação", route: "/wms/separacao", marker: /separa/i },
  { etapa: "4. WMS — Embalagem", route: "/wms/embalagem", marker: /embalag|packing/i },
  { etapa: "5. WMS — Expedição", route: "/wms/expedicao", marker: /expedi/i },
  { etapa: "6. Operacional — Faturamento", route: "/operacional/faturamento", marker: /fatur/i },
  { etapa: "7. Fiscal — Dashboard", route: "/fiscal/dashboard", marker: /fiscal|nf-?e|imposto/i },
  { etapa: "8. Financeiro — Contas a Receber", route: "/financeiro/receber", marker: /receber|títul/i },
  { etapa: "9. Financeiro — Tesouraria", route: "/financeiro/tesouraria", marker: /tesourar|saldo|banc/i },
  { etapa: "10. Estoque — Movimentações", route: "/estoque/movimentacoes", marker: /movimenta/i },
  { etapa: "11. Estoque — Auditoria (ledger)", route: "/estoque/auditoria-estoque", marker: /auditor|ledger|movimenta/i },
];

test.describe("E2E-CORE — Order to Cash", () => {
  for (const { etapa, route, marker } of CHAIN) {
    test(`${etapa} renderiza sem erro`, async ({ page }) => {
      const errors = collectErrors(page);
      await login(page);
      await visit(page, route);
      await expect(page.getByText(marker).first()).toBeVisible({ timeout: 15_000 });
      expect(errors, `Erros de runtime em ${route}:\n${errors.join("\n")}`).toHaveLength(0);
    });
  }

  test("cadeia completa navegável em sequência", async ({ page }) => {
    const errors = collectErrors(page);
    await login(page);
    for (const { route } of CHAIN) {
      await visit(page, route);
    }
    expect(errors, `Erros ao percorrer a cadeia:\n${errors.join("\n")}`).toHaveLength(0);
  });
});
