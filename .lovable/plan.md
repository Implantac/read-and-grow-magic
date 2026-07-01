
# USE ERP → Enterprise Product Program

Governança: **UEEF v1.0** (Evolution Mode, nunca reconstruir) + squad multidisciplinar (Arquiteto, PO, BA, ERP/WMS/PCP/MRP/BI, UX, DB, Perf, Sec, IA, FE/BE/FS Seniors).

## Fase 0 — Auditoria Consolidada (2 dias, read-only)

Consolidar `.lovable/audit-2026-07.md` com 12 novos eixos e produzir **`.lovable/audit-enterprise-2026-07.md`**:

| Bloco | Entregável |
|---|---|
| Estrutura | Grafo de dependências (`madge --json`), pastas órfãs, imports circulares |
| Rotas | 213 rotas × uso real (react-router matches vs telemetria de acesso), mortas listadas |
| Componentes | Duplicados por assinatura (ts-prune + jscpd), heatmap de reuso |
| Hooks | Padrão vs anti-padrão (chamadas condicionais, sem `useCompanyScope`) |
| Tipagens | `any` residuais, gaps entre `types.ts` (Supabase) e domínio |
| DB | 267 tabelas: RLS/GRANT/index/FK/órfãs, tabelas sem policy de write, triggers cross-module |
| Perf | Bundle por rota (`rollup-plugin-visualizer`), listas sem virtualização, N+1 queries |
| Segurança | RBAC vs UI, endpoints sem `require-auth`, secrets em código |
| UX | Telas sem EmptyState/Skeleton/Breadcrumb/aria-label, contraste WCAG AA |
| Integração | Fluxos cross-module quebrados (Sales→OP→Conferência→NF→AR) |
| IA | Onde há Cérebro/Copilot vs onde falta drill-down inteligente |
| Negócio | KPIs sem dono, indicadores sem meta, cards sem drill-down |

Saída: **top-50 achados** ranqueados por (impacto × esforço), classificados A/B/C.

## Fase 1 — Fundação Enterprise (Onda E, 1 sprint)

Componentes-plataforma que serão usados por todas as ondas seguintes. Zero reconstrução — apenas novas primitives que os módulos passam a consumir.

1. **`<EnterpriseKPICard>`** substituto opt-in de `KPICard` com 24 slots do briefing (valor/deltas D-W-M-Y, meta, progresso, tendência, cor, status, impacto R$/op, origem, drill-down, filtros, export CSV/XLSX/PDF, share link, comentários, histórico, audit trail, IA embed). API 100% compatível com o atual + props opcionais → adoção incremental.
2. **`<DrillDownDrawer>`** único e globalmente montado (padrão do BrainDrawer da Onda B) — abre para qualquer entidade: gráfico, tabela, timeline, docs, pedidos, clientes, produtos, responsáveis, plano de ação, logs, comentários, análise IA do indicador clicado.
3. **`<AIInsightPanel>`** — contrato único (`indicatorId + payload + horizon`) que chama a edge function `ai-insight` e devolve: causa raiz, responsáveis, impacto R$/op, risco 0-100, previsão, plano de ação com tarefas atribuíveis, automações sugeridas + botões de ação executável (via tool-calling do Cérebro já existente).
4. **`useDrillDown(entityKey, id)`** — hook agregador que já sabe puxar timeline, docs e related-items do dicionário `entityRegistry`.
5. Tokens de design Enterprise ampliados: `--surface-elevated`, `--surface-sunken`, `--border-strong`, `--focus-ring`, `--kpi-up`, `--kpi-down`, `--kpi-warn` — nada de cor hardcoded.
6. **DataTable virtualizada** (`@tanstack/react-virtual`) — evolução do `DataTable` atual, opt-in via `virtualized`.

Aceite: 3 KPI Cards do Dashboard Consolidado migram para `EnterpriseKPICard` com drill-down + IA funcionando fim-a-fim.

## Fase 2 — Dashboards como Centro de Decisão (2 sprints)

Migrar KPIs para `EnterpriseKPICard` **na ordem de retorno**:

| Ordem | Dashboard | KPIs |
|---|---|---|
| 1 | Executive Consolidado | Receita, Margem, AR, AP, Caixa, OEE, SLA WMS |
| 2 | Financeiro | Fluxo 30d, DRE, DFC, Inadimplência, Ticket médio |
| 3 | Comercial | Pipeline R$, Conversão, CAC, LTV, Churn, Ranking |
| 4 | WMS | Ocupação, Acuracidade, Picking/h, Backlog, SLA saída |
| 5 | Produção | OEE, Setup, Refugo, Aderência ao plano, Gargalos |
| 6 | Fiscal | NF-e emitidas, Rejeições, Carga tributária, SPED |

Cada card entrega as 3 perguntas: **O que / Por que / O que fazer agora**.

## Fase 3 — Módulos ao padrão Enterprise (3 sprints, paralelo)

Evolução em cima do que existe — nenhuma tela é recriada. Cada módulo só sai como "concluído" ao ter checklist do briefing (CRUD + regras + integrações + testes + estados + permissões + logs + IA + doc).

- **WMS**: Digital Twin já existe; adicionar Wave/Cluster/Zone Picking, Cross-Docking (já iniciado), Inventário Cego/Divergência, Mapa de Ocupação heatmap, Simulador de gargalos, RFID já plugado.
- **PCP/MRP**: Kanban inteligente com WIP limits (`kanban_limits` já existe), Capacidade finita×infinita, Carga máquina/operador, OEE consolidado, Replanejamento automático via `pcp-schedule`.
- **Financeiro**: DFC, EBITDA, Margem/Rentabilidade/Lucratividade, Rateio de centro de custos, Cobrança inteligente (já parcial), Score de crédito (`customer_credit_profiles` já existe).
- **Comercial**: Curva ABC clientes, LTV, Churn, Cross/Up-sell no `sales_playbooks`.
- **BI**: Consolidar Dashboard Engine já existente como módulo `/bi` com 6 dashboards profissionais (Recharts + drill-down).

## Fase 4 — UX/Perf/Sec Enterprise (1 sprint transversal)

- Eliminar 64 `Loader2` → `<Skeleton>` (Onda A parcialmente feita).
- Virtualização em 12 listas > 500 linhas.
- Prefetch React Query em hover do Sidebar.
- Contraste WCAG AA em 100% dos componentes.
- CSP + rate-limit por edge function via `require-auth`.
- Audit trail unificado (`system_audit_logs` já existe) plugado no `EnterpriseKPICard`.

## Fase 5 — Qualidade & Go-to-Market (1 sprint)

- Cobertura de smoke tests: 10 → 40 fluxos (expandir `.lovable/e2e/smoke.ts`).
- Testes de contrato para 36 edge functions.
- ADRs de arquitetura em `.lovable/adrs/`.
- Manual do produto em `docs/handbook/` com screenshots por módulo.
- Health-check público (`/status`) alimentado pela edge function `health-check`.

---

## Como executar

Cada onda entrega valor incremental e é mergível sozinha. Nenhuma quebra API pública dos hooks/componentes atuais — tudo é aditivo (`EnterpriseKPICard` convive com `KPICard`, drawer é global, IA usa contrato novo mas edge functions atuais).

## Detalhes técnicos

- Estado: React Query 5 (já em uso, staleTime 60s mantido).
- Virtualização: `@tanstack/react-virtual`.
- Gráficos: Recharts (já em uso), sem substituir.
- IA: edge function `ai-brain` já suporta tool-calling; nova função `ai-insight` reusa `business-knowledge.ts` + `data-tools.ts`.
- Drill-down: registrado em `src/core/entityRegistry.ts` mapeando `entityKey → { table, timeline, related[] }`.
- Export: novo `src/shared/export/{csv,xlsx,pdf}.ts` unificado.
- Testes: Vitest (unit) + Playwright (E2E) já configurados.

## Pergunta antes de começar

Confirmo iniciar por **Fase 0 (auditoria consolidada, read-only, 2 dias)** já nesta próxima resposta? Ou você prefere pular direto para **Fase 1 (fundação Enterprise: `EnterpriseKPICard` + `DrillDownDrawer` + `AIInsightPanel`)** para ver valor visível já na próxima entrega?
