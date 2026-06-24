
# Plano de Evolução — ERP Enterprise SaaS (Confecção, Moda, Distribuição e Manufatura)

Plano dividido em **6 fases sequenciais**. Cada fase entrega valor operacional ponta a ponta (DB + serviço + UI + permissões + auditoria), sem reescrever o que já existe.

---

## FASE 0 — Estabilização e Segurança (1–2 semanas)

Pré-requisito de tudo. O scanner apontou riscos críticos que precisam ser resolvidos antes de comercializar.

### 0.1 Isolamento multi-tenant (crítico)
- Auditar **todas** as edge functions que usam service-role e adicionar `.eq('company_id', callerCompanyId)`.
- Criar helper `resolveCompany(req)` único em `_shared/require-auth.ts` (já parcialmente feito).
- Adicionar testes automatizados de cross-tenant (chamar com UUID de outra company → 403).

### 0.2 Higiene de erros
- Padronizar respostas: mensagem genérica ao cliente + `console.error` server-side.
- Criar wrapper `safeHandler()` reutilizável.

### 0.3 Dependências vulneráveis
- Substituir `jspdf` por `pdf-lib` ou `@react-pdf/renderer` (jsPDF tem 10+ CVEs críticas/altas).
- Atualizar `react-router-dom`, `@supabase/supabase-js`, `recharts`.

### 0.4 Observabilidade base
- Tabela `system_audit_logs` já existe → garantir uso em **toda** mutação crítica via trigger.
- Edge function `log-ingest` para erros de UI.

---

## FASE 1 — Núcleo SaaS Multiempresa (2–3 semanas)

Hoje o projeto tem `company_id` espalhado, mas falta a camada de SaaS comercial.

### 1.1 Modelo de tenants
- Consolidar `companies` + `tenants` + `enterprise_groups` + `holding_entities` em hierarquia clara:
  ```
  tenant (assinante SaaS)
    └─ enterprise_group (holding)
         └─ company (empresa/CNPJ)
              └─ branch (filial)  ← NOVA
                   └─ warehouse (depósito)
  ```
- Adicionar `branch_id` (filial) onde fizer sentido: estoque, pedidos, NF-e, financeiro.

### 1.2 Billing SaaS
- `plans`, `plan_features`, `subscriptions`, `saas_invoices` já existem → ativar:
  - Limites por plano (usuários, NF-e/mês, GB storage, chamadas IA).
  - Medidor de uso em `usage_tracking` com cron diário.
  - Bloqueio gracioso ao exceder limite.
- Integração Stripe (assinatura) — usar `payments--enable_stripe_payments`.

### 1.3 Onboarding self-service
- Wizard: criar tenant → empresa → CNPJ (autopreenche via BrasilAPI) → plano → primeiro admin.
- Seed automático: plano de contas padrão, CFOPs, NCMs comuns, perfis RBAC.

### 1.4 RBAC granular
- `user_roles` já existe → expandir para **permissions matrix** (módulo × ação).
- UI de gestão de perfis no `PermissionsEditor`.

---

## FASE 2 — PLM para Confecção (3–4 semanas) — DIFERENCIAL

Maior gap competitivo. Hoje há `products`, falta engenharia de produto têxtil.

### 2.1 Estrutura do produto têxtil
Novas tabelas:
- `plm_collections` (coleção / linha / estação)
- `plm_references` (referência-pai: ex. "Camisa 1234")
- `plm_variants` (grade: cor × tamanho) — gera SKU filho
- `plm_color_chart` (cartela de cores)
- `plm_size_grid` (grade padrão: PP, P, M, G, GG / 36-44)

### 2.2 Ficha técnica
- `plm_tech_sheets` (já existe `product_technical_sheets` → expandir)
- `plm_bom_textile`: tecido principal, forro, aviamentos (botão, zíper, etiqueta) com consumo por tamanho.
- `plm_operations`: corte, costura, acabamento, lavanderia, bordado — com tempo padrão.
- Versionamento V1/V2/V3 com aprovação.

### 2.3 Custo do produto
- `plm_cost_simulation`: MP + MOD + CIF + impostos + margem → preço sugerido.
- Comparativo entre versões.

### 2.4 UI
- Tela tipo "fichário" com abas: Identificação, Cores, Grade, Ficha Técnica, BOM, Operações, Custo, Versões.
- Upload de croqui/imagem por variante.

---

## FASE 3 — PCP Industrial + APS (3–4 semanas)

`production_orders` existe → falta planejamento real.

### 3.1 Capacidade
- `production_resources`, `production_lines`, `production_machines` já existem → completar com calendário (turnos, paradas).
- `production_capacity` por recurso/dia.

### 3.2 MRP
- Cron `mrp-engine`: explode BOM dos pedidos de venda → gera necessidades de compra e ordens de produção.
- Considera estoque, em-pedido, lead time.

### 3.3 APS (Sequenciamento)
- Edge function `aps-scheduler`: heurística (EDD + setup time + gargalo) para sequenciar OPs nos recursos.
- Visualização Gantt (drag-and-drop manual).

### 3.4 Apontamento de chão de fábrica
- Terminal mobile (já há diretiva mobile-first): operador escaneia QR da OP, inicia/pausa operação.
- `production_time_logs` + cálculo automático de OEE.

### 3.5 Análise de gargalos
- `pcp-bottlenecks` já existe → expor dashboard com utilização vs. capacidade por recurso.

---

## FASE 4 — WMS Avançado + Logística (2–3 semanas)

Base WMS existe; faltam fluxos enterprise.

### 4.1 Endereçamento inteligente
- `wms_storage_locations` com regras (curva ABC, peso, validade FEFO).
- Putaway sugerido automaticamente.

### 4.2 Picking por ondas
- `picking_waves` já existe → algoritmo de agrupamento (por rota, transportadora, cliente).
- Picking por voz/RF (terminal mobile).

### 4.3 Inventário rotativo
- Geração automática de tarefas por curva ABC.
- Conciliação com ajustes contábeis.

### 4.4 TMS básico
- Romaneio de carga, integração Correios/Jadlog/Braspress (cotação + etiqueta).
- Tracking de entrega (`delivery_tracking`).

---

## FASE 5 — Fiscal Completo + Contabilidade (2–3 semanas)

NF-e/NFC-e já existem; faltam CT-e, MDF-e e SPEDs.

### 5.1 Documentos fiscais
- `cte`, `mdfe` já existem → completar emissão + transmissão SEFAZ.
- Inutilização, carta de correção, cancelamento.

### 5.2 SPED
- Geração ECD, ECF, Fiscal, Contribuições, EFD-Reinf.
- Validador integrado.

### 5.3 Apuração de impostos
- `tax_rules`, `tax_difal_rules`, `tax_icms_st_rules` já existem → motor de cálculo unificado.
- Apuração mensal: ICMS, IPI, PIS, COFINS, ISS, DIFAL.

### 5.4 Contabilidade automatizada
- Triggers: NF-e autorizada → lançamento contábil + financeiro (já existe parcialmente).
- DRE, Balanço, Balancete em tempo real.
- Fechamento de período com bloqueio.

---

## FASE 6 — Integrações e IA Aplicada (contínuo)

### 6.1 Conectores
- Bancos: PIX (já existe webhook), CNAB 240/400, Open Finance.
- Marketplaces: ML, Shopee, Amazon (sync produto, pedido, estoque).
- E-commerce: Shopify, WooCommerce, Nuvemshop.
- WhatsApp Business (já há templates).

### 6.2 IA aplicada (não genérica)
- **Previsão de demanda**: por SKU/coleção usando histórico + sazonalidade.
- **Compras inteligentes**: sugere PO baseado em MRP + lead time + sazonalidade.
- **Precificação dinâmica**: por margem-alvo, elasticidade, estoque parado.
- **Detecção de fraude financeira**: `financial_fraud_rules` já existe → completar.
- **Análise de crédito**: score de cliente (`customer_credit_profiles` existe).

---

## Detalhes técnicos

### Padrões obrigatórios em toda nova feature
1. Migração com: CREATE TABLE → GRANT → RLS → POLICY (scoped por `company_id`).
2. Hook React Query com `staleTime: 5min`, paginação server-side.
3. Service em `src/services/<modulo>/` (camada única de acesso).
4. Componente usa `PageContainer`, `PageHeader`, `KPICard`, `DataTable`, `AdvancedFilters`, `ExportButton`.
5. Edge function: `requireAuth` → `companyId` scoping → erro genérico → log estruturado.
6. Auditoria via trigger `system_audit_logs`.

### Métricas de aceitação
- p95 de listagens < 300ms com 100k linhas.
- Bundle inicial < 500KB gzip (já há code splitting).
- 0 findings críticos no scanner de segurança.
- Cobertura mínima de testes em edge functions: 70%.

---

## Sequenciamento sugerido (próximos passos imediatos)

1. **Esta semana**: Fase 0 completa (segurança + deps).
2. **Próximas 2 semanas**: Fase 1.1 + 1.2 (tenants + billing) — destrava SaaS.
3. **Mês 2**: Fase 2 (PLM Confecção) — diferencial de mercado.
4. **Mês 3**: Fase 3 (PCP/APS).
5. **Mês 4**: Fases 4–5 em paralelo.
6. **Contínuo**: Fase 6.

---

**Pergunta antes de aprovar:** quer que eu comece pela **Fase 0** (estabilização/segurança) ou prefere priorizar a **Fase 2 (PLM Confecção)** por ser o maior diferencial competitivo?
