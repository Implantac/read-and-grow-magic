# Smoke Tests — Onda D

Playwright smoke suite executed via `bunx playwright test` in local dev. Covers 10 critical paths.

## Fluxos cobertos
1. `/login` renderiza formulário com email/senha
2. Login válido redireciona para `/dashboard`
3. Dashboard mostra KPI de Faturamento
4. Sidebar: Financeiro inicia colapsado
5. Cmd+K abre CommandPalette
6. Ctrl+J abre BrainDrawer
7. `/financeiro/pagar` lista títulos ou EmptyState
8. `/wms/localizacoes` renderiza hierarquia 3 níveis
9. `/comercial/pedidos` lista pedidos + timeline link
10. `/sre` mostra observabilidade e health-check

Ver `/.lovable/e2e/smoke.ts` para script executável.
