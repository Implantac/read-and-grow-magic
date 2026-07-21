# USE Platform — Auditoria Global (Fase 1)
**Data:** 2026-07-21 · **Escopo:** monorepo completo (`src/`, `supabase/functions/`, `supabase/migrations/`) · **Modo:** Evolution (não reconstrução)

> Este documento é a fotografia atual do sistema **antes** de qualquer nova alteração da rodada de evolução. Nenhum código foi modificado na produção deste relatório. As correções serão emitidas em lotes pequenos e priorizados nas próximas iterações, seguindo a ordem definida na seção 9.

---

## 1. Inventário quantitativo

| Métrica | Valor |
|---|---:|
| Rotas em `src/routes/*` + `App.tsx` | **299** definições `<Route>` |
| Módulos de domínio (`src/modules/*`) | 10 domínios · **293** arquivos |
| Páginas (`src/pages/*`) | **79** |
| Hooks (`src/hooks/*`) | **189** |
| Services (`src/services/*`) | **25** arquivos em 8 domínios |
| Edge Functions | **59** funções ativas |
| Tabelas no schema `public` (via `types.ts`) | **374** `Row` tipadas |
| Arquivos > 500 linhas (excl. `types.ts`, `sidebar.tsx`) | **17** |
| Casts `as any` remanescentes | **203** ocorrências |
| Arquivos em `pages/`+`modules/` chamando `supabase` diretamente | **56** (bypass parcial do service layer) |

Base classificada como **grande porte** e **estruturalmente saudável** (ver `AUDIT_REPORT.md` e `.lovable/audit-2026-07-part2.md` existentes). O foco desta rodada é **consolidação**, não reescrita.

---

## 2. Mapa arquitetural atual

```
PLATFORM CORE      → auth, tenants, companies, branches, user_roles, permissions,
                     feature_flags, plans, subscriptions, billing_queue, notifications,
                     system_audit_logs (imutável), lgpd_*
BUSINESS CORE      → clients, suppliers, products, categories, orders, order_items,
                     stock_balances, stock_movements (ledger imutável), stock_lots,
                     financial_ledger, financial_boletos, payment_records
DOMAIN MODULES     → ERP (commercial/financial/purchasing/inventory)
                     WMS (wms_*, 30+ tabelas, RFID, waves, picking, packing, 3PL)
                     Fiscal (nfe/nfce/cte/mdfe/sped/reinf/tax_rules)
                     Contabilidade (accounting_*, journal_entries, DRE, fechamento)
                     Produção/PCP (production_*, feed_formulas, quality)
                     Commerce B2C (storefronts, storefront_orders, checkout público)
                     Relacionamento (NPS, CX health, churn)
                     TMS (carriers, routes, delivery_proof, vehicles)
INTELLIGENCE       → ai_brain_*, ai_executive_*, ai_forecast_*, ai_recommendations,
                     dashboard_definitions, cx_*, MCP tools
INTEGRATIONS       → 59 Edge Functions (SEFAZ, PIX, PSP, LGPD, cron, IA)
```

**Separação de camadas:** presente na maioria dos domínios (`services → hooks → modules/pages`), com desvios em Produção, WMS e algumas páginas de RFID/SRE que chamam `supabase` diretamente.

---

## 3. Multiempresa / SaaS

Fluxo esperado: `user → tenant → enterprise_group → company → branch → warehouse`.

**Estado:**
- Contexto persistido em `useEnterpriseStore` (`activeCompanyId`, `activeBranchId`) e enriquecido por `EnterpriseContext` via `vw_organizational_hierarchy`.
- Perfis (`profiles`) já protegidos por trigger contra troca própria de `company_id`/`branch_id` (Sprint SEC anterior).
- `storefront_orders` valida `company_id` contra a storefront referenciada (fix anterior).
- Papel `admin_matriz` implementado; operadores sem `branch_id` têm visibilidade zero (Sprint S-Multi-7).

**Riscos residuais identificados (P1):**
1. `EnterpriseContext` retorna `{ id: '00000000-…', name: 'Tenant Padrão' }` quando não há contexto — comportamento perigoso se algum caller usar esse valor em `INSERT`. Precisa ser marcado como *sentinel* explícito (`isPlaceholder: true`) e nenhum service deve gravar com esse ID.
2. Nem toda mutação valida `activeCompanyId` no client antes do submit; RLS cobre no server, mas a UX quebra silenciosamente.
3. `useMultiCompanyStore` coexiste com `useEnterpriseStore` — dois stores para o mesmo conceito.

---

## 4. Permissões e Feature Gates

Três eixos hoje: **role** (`user_roles` + `has_role`), **permissão granular** (`has_permission` RPC + `usePermission`/`<Can>`), e **plano** (`plans`, `plan_features`, `plan_modules`, `subscriptions`).

**Gaps:**
- Não existe um único hook `useAccess({ module, resource, action })` que combine plano + módulo + permissão. Consumidores misturam `<RoleGuard>` com `<Can>` inconsistentemente.
- `plan_modules` existe mas poucos módulos verificam antes de renderizar rota.
- `feature_flags` presente porém sem convenção clara de leitura.

---

## 5. Dados mockados / hardcoded

Varredura inicial encontrou **13 ocorrências** de `TODO|FIXME|mock` em `src/` (baixo, resultado de sprints anteriores de limpeza). Auditoria completa exige varredura por dashboard específico. Pontos conhecidos:
- `AlertsTable.tsx` (auditoria anterior) — array `nAlerts = []` hardcoded.
- Certos KPIs em `SellerDashboard` derivam de aggregations client-side sobre `orders` sem materialização (aceitável, mas custa performance).

Nenhum dashboard operacional depende hoje de valores fictícios em produção. Backlog de conversão para views/RPCs materializadas segue **P7**.

---

## 6. Ledger, Auditoria e Fechamento

Já entregues nas sprints A/H/K/M (últimas 20 iterações):
- `stock_movements` é **append-only** com trigger `apply_stock_movement_to_balance`; guarda impede `UPDATE`/`DELETE` sem bypass autorizado.
- `system_audit_logs` também imutável.
- `daily_fiscal_snapshots` fecha o dia às 23:55 UTC via cron; reabertura só por `reopen_fiscal_day` com justificativa auditada.
- Reconciliação diária (faturamento×estoque, banco×financeiro) + escalonamento SLA + notificações via `notify-alert-assignee`.

Este núcleo está sólido e **não deve ser tocado** nesta fase.

---

## 7. Débitos técnicos priorizados (achados novos + herdados)

### 🔴 Crítico (P0/P1)
| # | Item | Impacto |
|---|---|---|
| C1 | `EnterpriseContext` retorna tenant sentinel `00000000-…` sem flag — risco de INSERT com contexto vazio | Corrupção multi-tenant |
| C2 | 203 casts `as any` (WMS, Produção, RFID, hooks fiscais) — bypass de types gerados | Perda de RLS estática, refactors quebram silenciosamente |
| C3 | 56 arquivos em `pages/modules` chamam `supabase` direto — bypassa service layer | Regras espalhadas, testes difíceis |
| C4 | `useMultiCompanyStore` duplica `useEnterpriseStore` | Estado divergente |

### 🟠 Alto (P2/P3)
| # | Item |
|---|---|
| A1 | `clientService.ts` vs `clientsService.ts` — dois consumidores, APIs incompatíveis (ver `AUDIT_REPORT.md`) |
| A2 | 17 arquivos > 500 linhas concentram UI+data+regras (PDVDialog 1299, EducationDashboard 1150, pcpServices 1052) |
| A3 | Ausência de `useAccess` unificado (plano + módulo + permissão) |
| A4 | Rotas para páginas em `src/pages/inventory/*`, `src/pages/purchasing/*`, `src/pages/credit/*` — verificar registro consistente após múltiplas sprints |
| A5 | `SELECT *` sem `limit` em vários services (inventory, clients, sales) — não escala |

### 🟡 Médio (P4/P5)
| # | Item |
|---|---|
| M1 | `useDRE` / `useDREDynamic` / `useDREManagerial` — 3 hooks para o mesmo domínio |
| M2 | `src/services/inventory/inventoryService.ts` vs `src/services/wms/inventoryService.ts` — nomes iguais em domínios distintos |
| M3 | `core/infrastructure/BaseRepository.ts` sobrepõe `services/shared/baseService.ts` |
| M4 | `_shared/validate.ts` + `_shared/validation.ts` em edge functions — duplicados |
| M5 | 347 `.map()` sem memoização em WMS/Produção (perf latente) |

### 🟢 Baixo (P8/P9)
- `QueryClient` com `refetchOnWindowFocus` global.
- `App.tsx:101` — `error: any`.
- Falta de `VirtualList` em listas grandes de RFID e WMS conference.

---

## 8. Testes

- Vitest + Playwright configurados (`vitest.config.ts`, `playwright.config.ts`, `.lovable/e2e/`).
- Cobertura E2E hoje: `smoke.ts`, `cmdk.spec.ts`, `nps.spec.ts`. **Falta cobertura de fluxos ponta-a-ponta** de Compras, Vendas→WMS→Fiscal, Commerce checkout.
- Testes de RLS em `.lovable/tests/*.sql` (estáticos) — bom padrão mas não integrados a CI.

---

## 9. Roadmap de correção — ordem recomendada

Executar **um sprint por rodada**, com typecheck + build + smoke após cada um. Nenhum sprint recria funcionalidade existente.

| Sprint | Prioridade | Escopo | Risco |
|---|---|---|---|
| **AUD-1** | P1 | Sentinel de tenant explícito em `EnterpriseContext` + guarda em `baseService` bloqueando INSERT com company_id placeholder | Baixo |
| **AUD-2** | P1 | Unificar `useEnterpriseStore` ↔ `useMultiCompanyStore` (adapter, deprecar o segundo) | Baixo |
| **AUD-3** | P2 | Criar hook `useAccess({ module, resource, action })` combinando plano + módulo + permissão; migrar 5 rotas piloto | Médio |
| **AUD-4** | P2 | Tipar `wmsService`, `productionService`, `rfidService` — remover `as any` em bloco (usar `Database['public']['Tables']`) | Médio |
| **AUD-5** | P3 | Consolidar `clientService` → `clientsService` (adaptar `ServiceLocator`) | Baixo |
| **AUD-6** | P3 | Consolidar hooks DRE (`useDRE` com prop `variant`) | Baixo |
| **AUD-7** | P4 | Extrair `pcpServices.ts` (1052 linhas) para `services/production/{bom,routing,scheduling,capacity}.ts` | Médio |
| **AUD-8** | P5 | Split de `PDVDialog.tsx` (1299) em subcomponentes coesos | Médio |
| **AUD-9** | P6 | Paginação + `limit` obrigatório em services que fazem `SELECT *` | Baixo |
| **AUD-10** | P7 | Cobertura E2E: Compras E2E + Vendas→Fiscal + Commerce checkout | Alto (esforço) |

---

## 10. Score atual (0–10)

| Dimensão | Score | Observação |
|---|:-:|---|
| Funcionalidade | 8 | Núcleos ERP/WMS/Fiscal/Commerce operantes |
| Regras de negócio | 8 | Ledger imutável, fechamento fiscal, reconciliação automática já implementados |
| Arquitetura | 6 | Camadas presentes mas com 56 bypasses e stores duplicados |
| UX | 7 | Dark premium consistente, painéis modernos; alguns módulos >500 linhas prejudicam manutenção |
| Performance | 6 | Falta paginação obrigatória e memoização em listas grandes |
| Segurança | 8 | RLS forte, ledger + auditoria imutáveis, findings críticos resolvidos |
| Testabilidade | 5 | Vitest + Playwright presentes, mas cobertura E2E baixa |
| Documentação | 7 | ADRs, memórias e sprints bem registrados |
| **Média** | **6.9** | Base sólida, evolução por consolidação |

---

## 11. Critério de conclusão do processo global

O processo de auditoria+evolução só será considerado concluído quando:

1. Zero casts `as any` em services de domínio crítico (WMS/Produção/Fiscal/Financeiro).
2. 100% das mutações de negócio passam por service layer.
3. `useAccess` unificado adotado em ≥ 80% das rotas.
4. Nenhum store duplicado.
5. Cobertura E2E cobrindo os 3 fluxos ponta-a-ponta principais.
6. Nenhum arquivo de domínio > 600 linhas.
7. Scan de segurança sem findings 🔴 abertos.

---

## Próximo passo sugerido

Executar **Sprint AUD-1** (sentinel de tenant). É de baixo risco, alto valor, e destrava as demais consolidações sem tocar em UI. Confirme para eu prosseguir.
