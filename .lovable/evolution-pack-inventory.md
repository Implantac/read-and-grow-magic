# USE Enterprise Evolution Pack v1.0 — Inventário & Auditoria Consolidada

> Data: Jul/2026. Governança: UEEF Constitution v1.0 (evoluir, nunca reconstruir).
> Escopo: mapear estado atual do USE Patrium (ERP + CRM + WMS + Commerce + BI + IA), identificar lacunas e priorizar próximas iterações. **Este documento não altera código** — é a base do roadmap.

---

## 1. Inventário de Alto Nível

### 1.1 Stack & Governança
- **Frontend**: React 18 + Vite 5 + TS 5 + Tailwind v3 + shadcn (design tokens `src/index.css`).
- **Backend**: Lovable Cloud (Supabase) — RLS multi-tenant, edge functions Deno, cron jobs.
- **IA**: Lovable AI Gateway (Gemini/GPT) — sem chaves de usuário.
- **Governança**: UEEF Constitution v1.0 + 5 ADRs vigentes + Maturity Audit mensal (score global **78/100** em Jul/26).

### 1.2 Superfície do Produto
| Camada | Quantidade | Observações |
|---|---|---|
| Rotas registradas em `App.tsx` | **107** | 11 arquivos `*Routes.tsx` + rotas dedicadas Commerce/RFID/TMS/Credit |
| Módulos em `src/modules/` | **10** | accounting, admin, commercial, financial, fiscal, operational, production, relacionamento, success, wms |
| Páginas em `src/pages/` | **~40 diretas + 10 subpastas** | commerce, credit, executive, inventory, purchasing, rfid, tms, profile, admin |
| Edge Functions | **56** | fiscais, financeiras, IA (brain/executive/commercial), NPS, CX, PCP, WMS, PSP, RFID |
| Tabelas Supabase (public) | **~300** | RLS habilitado; ver `<supabase-tables>` |

### 1.3 Módulos por Domínio
- **ERP núcleo**: Financial (30+ telas), Fiscal (NF-e/NFC-e/SPED/Reinf), Accounting (DRE, balancete, período), Purchasing (POs, cotações, aprovações), Inventory (Kardex, ABC), Production (PCP, APS, OEE, MRP, Digital Twin), Commercial (CRM básico, Sales Automation, Forecast, Playbooks, Gamification), WMS (35+ telas incl. Wave Planning v2, Slotting ML, Digital Twin, 3PL Billing).
- **Operacional**: Coletor mobile (picking/putaway/receiving), TMS (rotas, POD, tracking), RFID (readers, tags, eventos).
- **Plataforma**: Admin (planos, feature flags, tenants), Marketplace de Plugins (com reviews e versões), SRE (SLO, on-call, postmortems, runbooks), Workflow Engine, MCP server, Custom Entities.
- **IA**: Cérebro Nativo multi-agente, IA Executiva (CFO/COO), IA Comercial, IA Fiscal, IA Produção, IA WMS, Studio de conteúdo (planejado).
- **Commerce B2C (novo, MVP em curso)**: `storefronts`, `storefront_products`, `storefront_pages`, `storefront_orders`, `storefront_order_items`, `storefront_payment_events`, `commerce_themes`. Webhook PSP unificado (`psp-webhook`) + painel de eventos com filtros/paginação/ordenação.

---

## 2. Auditoria de Maturidade (jul/26)

Score global: **78/100** (▲ +5 vs jun/26). Meta Set/26: 85.

| Domínio | Score | Destaques | Gaps prioritários |
|---|---|---|---|
| Fiscal | 82 | Reinf R-2010/R-4020, transmissão sandbox, tax engine, SPED | Certificado A1 real, R-2020, R-2099 |
| Financeiro | 84 | Conciliação auto, Open Finance, DRE dinâmica | PIX recorrente, DRE gerencial drill-down |
| WMS | 88 | Wave Planning v2, Digital Twin, Slotting ML, 3PL | Voice picking, cross-dock em fluxo |
| SaaS Core | 86 | Multi-tenant RLS, RBAC, Feature Flags, Marketplace | Faturamento por uso ao vivo |
| IA/Brain | 82 | Painel quota, decisões auditáveis | Fine-tune por tenant, Studio de conteúdo |
| Comercial | 76 | Sales AI, Kanban, Playbooks, Forecast MC | Forecast probabilístico consolidado |
| SRE | 74 | SLO, error budget, postmortems, on-call | Runbooks ligados a alertas |
| Produção | 72 | OEE, MRP, Kanban, APS | APS multi-restrição, sequenciamento |
| Contábil | 70 | Partida dobrada, balancete | Consolidação, DFCs auto |
| Compras | 68 | POs, cotações, supplier scoring | Aprovação hierárquica, contratos |
| Estoque | 80 | Kardex, ABC, reservas | Multi-empresa consolidado |
| **Commerce B2C** | **35** | Storefronts, checkout, PSP webhook, painel eventos | Storefront público, catálogo público, temas premium, integração fiscal/estoque real |
| CRM Nativo | 40 | CRM básico (leads, oportunidades, pipeline) | Timeline 360°, segmentação, campanhas WhatsApp |
| BI com IA | 50 | Financial BI, BI Industrial, Ask-the-data parcial | Data marts materializados, dashboards drag-drop |
| PLM | 20 | BOM multi-nível, ficha técnica | Versionamento, ECO, aprovações |

---

## 3. Lacunas por Eixo (Evolution Pack)

### Eixo 1 — Core Platform
- ✅ Multi-tenant, RLS, Feature Flags, Planos modulares.
- ⚠️ Falta: **billing usage-based ao vivo** (usage_tracking existe, faltam webhooks Stripe fechando o loop de cobrança).
- ⚠️ Falta: **onboarding guiado por segmento** com fixtures/samples.

### Eixo 2 — ERP
- ✅ Financeiro, Fiscal, Contábil, Compras, Estoque, Produção sólidos.
- ⚠️ **DRE Gerencial** com drill-down por centro de custo (score 70 contábil).
- ⚠️ **Aprovação hierárquica de Compras** (reuso Workflow Engine v3).
- ⚠️ **APS Produção** — sequenciamento multi-restrição.

### Eixo 3 — Commerce B2C
- ✅ MVP: storefronts, produtos, pedidos, checkout, PSP webhook, painel eventos com filtros/paginação.
- ❌ **Storefront público** (rota `/loja/:slug`) com catálogo navegável e carrinho.
- ❌ **Marketplace de temas** (temas grátis + premium com royalty).
- ❌ Integração de estoque real: `storefront_products` deve refletir `stock_balances` em tempo real.
- ❌ Emissão fiscal automática (NFC-e/NF-e) no pagamento aprovado.
- ❌ SEO por loja (meta, sitemap, OG image).

### Eixo 4 — CRM Nativo
- ✅ `crm_leads`, `crm_opportunities`, `crm_pipelines`, `crm_pipeline_stages`, `client_timeline`.
- ❌ **Timeline 360°** consolidando pedidos + tickets + NPS + WhatsApp na tela do cliente.
- ❌ **Segmentação dinâmica** para campanhas (base para Mailchimp/WhatsApp).
- ❌ **Inbox unificada** (WhatsApp + Instagram DM).

### Eixo 5 — WMS
- ✅ Maduro (88/100). Wave Planning v2, Digital Twin, Slotting ML, 3PL Billing.
- ❌ **Realtime push** — hoje React Query staleTime 5m; falta Supabase Realtime + `useRealtimeWMS`.
- ❌ Voice picking / cross-dock em fluxo integrado.

### Eixo 6 — PCP + PLM
- ✅ PCP: OEE, MRP, APS, Digital Twin, ML predictions.
- ❌ **PLM MVP**: BOM versionada + ECO (Engineering Change Order) + aprovações.
- ❌ APS multi-restrição por máquina/turno.

### Eixo 7 — Marketplace (Plugins + Temas)
- ✅ `plugins`, `plugin_installations`, `plugin_versions`, `plugin_reviews`, `plugin_executions`.
- ❌ **Marketplace de Temas** para Commerce (novo domínio).
- ❌ Filtros avançados: rating min, preço, popularidade.
- ❌ Screenshots/vídeo por plugin.
- ❌ Auto-update opcional em janela de manutenção.

### Eixo 8 — BI + IA
- ✅ IA Executiva, IA Fiscal (MCP), IA Comercial, IA Produção, IA WMS, Cérebro Nativo.
- ❌ **Data marts materializados** (vendas, financeiro, estoque, produção).
- ❌ **Dashboards editáveis** drag-drop sobre marts.
- ❌ **Ask-the-data NL→SQL** consolidado (existe parcialmente).
- ❌ **IA Studio de Conteúdo** (descrições produto, banners, campanhas).

---

## 4. Roadmap Priorizado (próximas 6 sprints)

| Sprint | Foco | Entregas-chave | KPI-alvo |
|---|---|---|---|
| **S1 – jul/26 (em curso)** | Commerce B2C público | Storefront público `/loja/:slug`, catálogo, carrinho, aplicar tema | Primeira loja publicada |
| **S2 – ago/26** | Commerce integração ERP | `storefront_products` ↔ `stock_balances` realtime; emissão NFC-e no pedido pago | 100% pedidos c/ nota fiscal |
| **S3 – ago/26** | Marketplace de Temas | Tabela `commerce_theme_marketplace`, revenue-share, preview | 3 temas publicados |
| **S4 – set/26** | WMS Realtime | `useRealtimeWMS`, badge "ao vivo", invalidação de queries | Latência < 2s p95 |
| **S5 – set/26** | CRM 360° | Timeline consolidada + segmentação dinâmica | 100% clientes com timeline |
| **S6 – out/26** | BI Data Marts | Marts materializados + Ask-the-data NL→SQL | 5 dashboards drag-drop |

Backlog longo prazo: DRE Gerencial, Aprovação hierárquica Compras, APS multi-restrição, Forecast probabilístico, On-call/Runbooks, PLM MVP, IA Studio, Inbox WhatsApp/Instagram.

---

## 5. Checklist Evolution Pack (estado atual)

| Item | Status | Observação |
|---|---|---|
| Arquitetura | ✅ | Multi-tenant, modular, ADRs vigentes |
| Banco | ✅ | ~300 tabelas, RLS + GRANT padronizados |
| APIs (edge functions) | ✅ | 56 functions, MCP server, PSP webhook |
| UX | ⚠️ | Shared components padronizados; Commerce público falta polish |
| Performance | ✅ | React Query 5m staleTime, code splitting |
| Segurança | ✅ | RLS, RBAC granular (`has_permission`), audit logs, LGPD |
| Documentação | ⚠️ | ADRs + Maturity + Strategy OK; manuais de usuário parciais |
| Roadmap atualizado | ✅ | Este documento (jul/26) |
| Testes de aceitação | ⚠️ | e2e/smoke + Playwright; falta ampliar cobertura Commerce e CRM |
| Feedback usuários | ⚠️ | NPS + CX Health ativos; loop de priorização a formalizar |

---

## 6. Guardrails UEEF (aplicáveis a toda evolução)
- **Nunca reconstruir** módulos existentes sem ADR justificando.
- **Nunca duplicar**: reutilizar `PageContainer`, `PageHeader`, `KPICard`, `DataTable`, `AdvancedFilters`, `EmptyState`, `PaymentEventsPanel`.
- **Multi-tenant sempre**: toda nova tabela ganha `tenant_id`, RLS + GRANT + policies escopadas por `auth.uid()`.
- **IA sempre via Lovable AI Gateway**; nunca pedir chave ao usuário.
- **PT-BR** em toda UI e mensagens.
- **Sem mocks**: dados reais de Supabase; nunca fallback estático.
- **Design tokens** em `src/index.css`; nunca cores hardcoded.

---

## 7. Próxima Ação Sugerida
Iniciar **Sprint 1** (Commerce B2C público): expor storefront navegável em `/loja/:slug` consumindo `storefronts` + `storefront_products` + `commerce_themes`, com carrinho local e finalização apontando para o `StorefrontCheckout` já existente. Sem alterar dados; apenas nova rota pública + componentes.
