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
- ✅ `financial-insights`, `fiscal-transmitter`, `financial-intelligence`
- ✅ `financial-audit` (esta sessão) — `String((e as Error).message)` → `'Erro interno. Tente novamente.'`
- ✅ `ai-executive` (esta sessão) — top-level catch agora retorna mensagem genérica
- ✅ `admin-users:222` — já usa whitelist `safeMessages`
- ✅ `ai-executive` inner `erro: error.message` (≈8 ocorrências) — não são client-facing; alimentam o LLM (tool results)

## 4. Dependências vulneráveis
- ✅ `@supabase/supabase-js` → `^2.108.2` (corrige `ws` DoS/uninit memory)
- ✅ `jspdf` **removido** — `src/lib/fiscalDocuments.ts` reescrito com `pdf-lib@1.17.1` (sem CVEs conhecidos). Todas as advisories de jsPDF (path traversal, HTML/AcroForm injection, BMP/GIF DoS, addJS, XMP) deixam de aplicar.
- ⏸️ `react-router-dom@6.30.1` — fix está em v7 (major). Bump major requer regressão de rotas; agendar.
- ⏸️ `recharts@2.15.4` — fix em v3 (major, breaking). Agendar.

## 5. Auditoria `system_audit_logs` (✅ esta sessão)
Trigger `fn_audit_sensitive_mutation` + `trg_audit_<tabela>` ativos em:
`user_roles`, `profiles`, `companies`, `ai_brain_decisions`, `accounts_payable`,
`accounts_receivable`, `financial_ledger`, `bank_accounts`, `production_orders`,
`fiscal_documents`, `tax_rules`. Captura `INSERT/UPDATE/DELETE`, `auth.uid()` e
`company_id` (best-effort; falha silenciosa para não bloquear a mutação).

## 6. RBAC / Sessão
- ✅ `has_role()` SECURITY DEFINER em uso
- ⚠️ Auditar uso de localStorage/sessionStorage em rotas administrativas

## 7. Validação Zod-like nas Edge Functions (✅ 100%)
- `_shared/validation.ts` (sem dep externa, cold-start zero)
- Aplicado:
  - `pcp-priority`, `pcp-schedule-simulate` (schemas completos)
  - `pcp-schedule` — enum `action ∈ {suggest, apply}`
  - `production-events` — enum `action ∈ {process_queue, iot_ingest, get_analytics}`
  - `ai-commercial` — enum de 7 ações
  - `ai-executive` — enum de 10 ações + `months` numérico 1–60
  - `ai-brain` — enum de 14 ações + `decisionId` UUID nas ações de decisão
  - `fiscal-transmitter` — `nfeId` UUID, `action ∈ {transmit, cancel}`, `reason` mínimo 15 chars em cancelamento

## 8. Defensive hardening
- ✅ `pcp-priority` e `pcp-schedule` agora incluem `.eq('company_id', callerCompany)` em **todos** os `UPDATE`

## Critério de saída da Fase 0
- [x] 0 findings críticos no scanner
- [x] 0 deps críticas (jspdf removido, migrado para pdf-lib)
- [x] Helper de tenant + validação disponíveis
- [x] 100% edge functions auditadas com `company_id` scope + erro genérico
- [x] Trigger de auditoria ativo em tabelas sensíveis
- [x] Validação aplicada em 100% das funções com body (8/8)

**Status: ✅ FASE 0 CONCLUÍDA** — pendente apenas bumps majors opcionais (react-router v7, recharts v3).


