# Fase 0 — Auditoria de Segurança & Estabilização

Status: **EM EXECUÇÃO** · Atualizado nesta sessão

## 1. Helper compartilhado de tenant

Criado `supabase/functions/_shared/tenant.ts` com:

- `corsHeaders` padrão (inclui `x-cron-secret`)
- `requireCompany(auth)` — extrai `company_id` do resultado de `requireAuth`
- `assertSameCompany(rowCompanyId, callerCompanyId)` — boolean para 403 cross-tenant
- `safeError(err, context, status?)` — resposta genérica + `console.error` no servidor
- `jsonResponse` / `jsonError` — wrappers padronizados

`_shared/require-auth.ts` já resolve `companyId` a partir de `profiles` e suporta cron.

## 2. Scan das Edge Functions

### ✅ Já corrigidas (turnos anteriores)
- `ai-brain`, `ai-commercial`, `ai-production`
- `financial-audit`, `financial-insights`
- `fiscal-transmitter`
- `pcp-bottlenecks`, `pcp-priority`, `pcp-schedule`
- `admin-users`, `ai-executive`

### ✅ Corrigidas nesta sessão
| Função | Gap | Correção |
|---|---|---|
| `financial-intelligence` | `bank_transactions` sem `company_id`; erro cru | `requireAuth` + scope + mensagem genérica |
| `pcp-metrics` | `production_orders` sem scope | resolve `company_id` do profile + `.eq('company_id', …)` + 403 se ausente |
| `pcp-schedule-simulate` | `production_orders` + `production_capacity` sem scope | mesma estratégia |

### ✅ Corrigidas nesta sessão (cron multi-tenant)
| Função | Correção |
|---|---|
| `daily-bank-reconciliation` | Loop por `companies`; `auto_match` por `bank_account` da empresa; `bank_transactions` / alertas / logs com `company_id` |
| `daily-executive-report` | Loop por `companies`; AR/AP/sales/cash escopados; `daily_executive_reports.company_id` preenchido |
| `production-events` | Resolve `company_id` do caller; `production_events`, `production_orders`, `iot_telemetry`, `industrial_alerts` escopados |

### 🟢 Webhooks externos (escopo natural por chave)
- `pix-webhook` — escopo via `txid` único
- `rfid-webhook` — escopo via `epc`/`code` (reader)
- `ai-sales-message` — apenas envio outbound (sem leitura cross-tenant)

## 3. Higiene de erro (raw `error.message` no body)
- ✅ `financial-insights` (turno anterior)
- ✅ `fiscal-transmitter` (turno anterior)
- ✅ `financial-intelligence` (esta sessão)
- ⚠️ `admin-users:222` — `const msg = (error as Error).message` → revisar uso e mascarar

## 4. Dependências vulneráveis (next step)
- `jspdf@3.0.1` → migrar para `pdf-lib`
- `@supabase/supabase-js` → bump
- `react-router-dom@6.30.1` → bump (XSS open redirect)
- `recharts` → bump (lodash)

## 5. Auditoria `system_audit_logs` (next step)
Trigger genérico para mutações em tabelas sensíveis + logging de 403 cross-tenant.

## 6. RBAC / Sessão
- ✅ `has_role()` SECURITY DEFINER em uso
- ⚠️ Auditar uso de localStorage/sessionStorage em rotas administrativas

## 7. Validação Zod nas Edge Functions
- Pendente — aplicar schema em todas as funções com body

## Critério de saída da Fase 0
- [ ] 0 findings críticos no scanner
- [ ] 0 deps críticas
- [x] Helper de tenant disponível
- [ ] 100% edge functions com `company_id` scope + erro genérico + Zod
- [ ] Trigger de auditoria ativo em tabelas sensíveis
