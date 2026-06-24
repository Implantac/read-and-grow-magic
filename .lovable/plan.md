
# Fase 1 — Núcleo SaaS Multiempresa

Objetivo: transformar o ERP num produto SaaS comercializável, com hierarquia tenant→empresa→filial, billing por plano com limites, onboarding self-service e RBAC granular. Cada módulo entrega ponta a ponta (DB + edge function + UI + RLS + auditoria) e deve estar **gated por plano** desde o dia 1.

Duração estimada: 2–3 semanas. Ordem é sequencial — cada módulo depende do anterior.

---

## Módulo 1.1 — Hierarquia de Tenants (fundação)

**Escopo**
- Consolidar hierarquia: `tenant → enterprise_group → company → branch → warehouse`.
- Criar tabela `branches` (filiais por CNPJ/CNPJ-base) com `company_id`, código, endereço, IE, regime fiscal.
- Adicionar `branch_id` (nullable, default = filial matriz) em: `orders`, `accounts_payable`, `accounts_receivable`, `financial_ledger`, `fiscal_documents`, `stock_movements`, `production_orders`.
- Migrar dados existentes: criar 1 filial "Matriz" por company; backfill `branch_id`.
- Helper `resolveContext(req)` em `_shared/tenant.ts` retornando `{ userId, tenantId, companyId, branchId }`.
- Seletor de filial no `Topbar` (persistido em `useEnterpriseStore`).

**Critérios de aceite**
- [ ] Toda tabela operacional tem `branch_id` indexado.
- [ ] RLS atualizada: `has_company_access(company_id)` + opcional `has_branch_access(branch_id)`.
- [ ] Trocar filial no Topbar filtra listagens de pedidos, financeiro, estoque e NF-e.
- [ ] Backfill 100% sem nulos em `branch_id` para registros existentes.
- [ ] Teste cross-tenant: usuário da Company A com UUID de branch da Company B → 403.

---

## Módulo 1.2 — Catálogo de Planos e Features

**Escopo**
- Revisar `plans` e `plan_features`; seed dos planos comerciais: **Starter, Professional, Business, Enterprise**.
- Cada plano define limites: `max_users`, `max_companies`, `max_branches`, `nfe_per_month`, `storage_gb`, `ai_calls_per_month`, módulos habilitados (PCP, WMS, PLM, IA Executiva).
- Tabela `plan_modules` (plan_id × module_key, boolean).
- Hook `usePlanFeatures()` e componente `<FeatureGate module="wms">…</FeatureGate>`.
- Sidebar oculta itens não inclusos no plano; rotas protegidas redirecionam para `/upgrade`.

**Critérios de aceite**
- [ ] 4 planos seedados em produção com limites diferenciados.
- [ ] Tentar acessar `/wms` no plano Starter → tela de upgrade.
- [ ] `useUserPlan()` cacheado (React Query, 10 min staleTime).
- [ ] PT-BR em todas mensagens de bloqueio.

---

## Módulo 1.3 — Medidor de Uso e Bloqueio Gracioso

**Escopo**
- Tabela `usage_tracking(tenant_id, metric, period_start, period_end, value)`.
- Edge function `usage-aggregator` (cron 02:00 UTC) que apura por tenant: usuários ativos, NF-e emitidas no mês, storage usado, chamadas IA (lendo `ai_brain_decisions`, `fiscal_documents`, etc).
- Função `check_quota(tenant_id, metric)` chamada antes de operações sensíveis (emitir NF-e, criar usuário, chamar IA).
- Política: 80% → aviso no Topbar; 100% → bloqueia operação, libera leitura.
- UI: card "Uso do plano" no Dashboard com barras de progresso por métrica.

**Critérios de aceite**
- [ ] Cron roda diariamente e popula `usage_tracking`.
- [ ] Emitir NF-e além do limite retorna 402 com mensagem PT-BR e CTA "Fazer upgrade".
- [ ] Card de uso reflete em tempo real (revalida ao mudar de página).
- [ ] Auditoria registra todo bloqueio em `system_audit_logs`.

---

## Módulo 1.4 — Onboarding Self-Service

**Escopo**
- Rota pública `/signup` (4 passos): conta admin → dados da empresa (CNPJ autopreenche via BrasilAPI) → escolha de plano → confirmação.
- Edge function `tenant-provisioning` (service-role) executa em transação:
  1. Cria `tenant`, `company` (matriz), `branch` (matriz), `subscription` (trial 14 dias).
  2. Seeda plano de contas contábeis, CFOPs comuns, NCMs frequentes, perfis RBAC padrão (admin/manager/operator/viewer), centro de custo padrão.
  3. Atribui role `admin` ao usuário criador.
- Tela de boas-vindas com checklist: cadastrar 1º produto, 1º cliente, configurar certificado A1, convidar equipe.

**Critérios de aceite**
- [ ] Signup completo cria tenant 100% funcional em < 5s.
- [ ] CNPJ inválido → erro antes de submeter.
- [ ] Trial de 14 dias expira corretamente e bloqueia escrita (libera leitura/export).
- [ ] Email de boas-vindas enviado via edge function de email.

---

## Módulo 1.5 — Billing Stripe

**Escopo**
- Ativar `payments--enable_stripe_payments`.
- Tabelas `stripe_customers`, `stripe_subscriptions` (já existem `saas_invoices` — reaproveitar).
- Edge functions: `create-checkout-session`, `customer-portal`, `stripe-webhook` (handle `customer.subscription.updated/deleted`, `invoice.paid/failed`).
- UI: página `/billing` com plano atual, próxima cobrança, link para portal Stripe, histórico de faturas.
- Sincronização: webhook atualiza `subscriptions.status` (active/past_due/canceled) e libera/bloqueia features.

**Critérios de aceite**
- [ ] Upgrade Starter → Pro reflete em < 30s após pagamento.
- [ ] `past_due` por 7 dias → tenant cai para modo somente-leitura.
- [ ] Webhook idempotente (event_id deduplicado).
- [ ] Faturas PDF baixáveis do portal Stripe.

---

## Módulo 1.6 — RBAC Granular (Permissions Matrix)

**Escopo**
- Tabela `permissions(role app_role, module text, action text)` — ex: (`manager`, `financial`, `approve_payment`).
- Função `has_permission(user_id, module, action)` SECURITY DEFINER.
- Refatorar checagens espalhadas (`hasRole('admin')`) para `hasPermission('financial.approve_payment')`.
- UI `PermissionsEditor` redesenhada como matriz módulo × ação por perfil, com toggle por permissão.
- Auditoria: toda mudança de permissão gera linha em `system_audit_logs`.

**Critérios de aceite**
- [ ] Matriz cobre ≥ 8 módulos × ≥ 6 ações cada.
- [ ] Trocar permissão reflete em < 1s (invalidação de cache).
- [ ] Operator sem `production.create_order` não vê botão "Nova OP".
- [ ] Diff visual da mudança de permissão registrado na auditoria.

---

## Ordem de execução e dependências

```text
1.1 Hierarquia ──┬──> 1.2 Planos ──> 1.3 Uso ──> 1.5 Billing
                 │
                 └──> 1.4 Onboarding ──> 1.5 Billing
                                              │
                                              └──> 1.6 RBAC
```

1.1 é bloqueante para tudo. 1.2 e 1.4 podem rodar em paralelo após 1.1. 1.5 depende de 1.2+1.3+1.4. 1.6 é independente mas mais útil após 1.5 (cobra por perfis adicionais em planos altos).

## Definition of Done da Fase 1

- [ ] Todos 6 módulos com critérios de aceite verdes.
- [ ] Cobertura de testes cross-tenant em todos endpoints novos.
- [ ] Documentação `/docs/saas-architecture.md` atualizada.
- [ ] `.lovable/phase-1-audit.md` criado com checklist final.
- [ ] Tenant demo (`demo@empresa.com`) provisionado para QA.

## Fora de escopo (vai para Fase 2)

- PLM têxtil (coleções, grade cor×tamanho, ficha técnica).
- White-label por tenant (domínio custom, logo, tema).
- Marketplace de integrações.
