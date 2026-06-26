# Relatório de Segurança — QA Cycles 01-65

**Status**: ✅ Base estabilizada
**Última atualização**: 2026-06-26
**Escopo**: ERP multi-tenant SaaS (React + Supabase)

---

## 1. Multi-tenancy (RLS)

- **228 tabelas** com RLS habilitado.
- Helper central `get_user_company_id(auth.uid())` usado em 100% das policies de leitura/escrita.
- `has_role(_user_id, _company_id, _role)` (3-arg) preferido sobre overload de 2-arg para evitar escalação cross-tenant.
- Tabelas de catálogo global (`plans`, `plan_modules`, `permissions`, `role_permissions`) — escrita restrita a `service_role`.
- Realtime channels filtrados por `company_id=eq.<id>` no client (Ciclo 50).
- Cache do React Query limpo com `queryClient.clear()` ao trocar empresa/filial (Ciclo 37).

## 2. Auth

- HIBP (Have I Been Pwned) ativado.
- Anonymous sign-ins desabilitados.
- Auto-confirm email mantido (modelo SaaS self-service).
- Login/Signup/Reset com mensagens neutras (sem enumeração de usuários — Ciclo 58).
- Token Supabase em `localStorage` (chave isolada por projeto); CSRF não aplicável (Bearer header, sem cookies).

## 3. Edge Functions (29 funções)

- `_shared/require-auth.ts` valida JWT e mapeia `company_id`.
- `_shared/tenant.ts` exige `companyId` em todas as queries e suporta `requireModule`, `enforceQuota`, `requirePermission`.
- `_shared/rate-limit.ts` aplicado em `ai-brain`, `ai-executive`, `ai-sales-message`, `pix-webhook`, `admin-users`.
- `_shared/hmac.ts` valida assinatura em `pix-webhook` e `rfid-webhook`.
- `_shared/validate.ts` (Zod) padroniza validação de payloads.
- `safeError()` mascara mensagens internas em respostas 5xx.

## 4. Cron Jobs (11 ativos)

| Job | Schedule | Tenant scoping |
|---|---|---|
| daily-executive-report | 10:00 UTC | iterates por empresa |
| daily-bank-reconciliation | 06:00 UTC | iterates por empresa |
| ai-brain autopilot | 07:00 UTC | iterates por empresa |
| financial-audit | */5 min | iterates por empresa |
| ai-brain semanal | seg 08:00 | iterates por empresa |
| ai-brain 4h | */4h | iterates por empresa |
| automation-dispatch | */1 min | iterates por empresa |
| purge_old_audit_logs(180) | 03:00 UTC | bulk LGPD |
| purge_old_logs_all() | 03:00 UTC | bulk LGPD (14 tabelas) |

## 5. SECURITY DEFINER

- 96 funções auditadas, 100% com `SET search_path = public`.
- Nenhuma executável por `public`/`anon`.
- RPCs expostas a `authenticated`: apenas validators (`has_role`, `has_permission`, `has_module_access`, `has_branch_access`, `get_user_company_id`, `get_user_role`, `check_quota`, `compensate_check`).

## 6. Triggers cross-módulo (auditados)

- `generate_accounting_from_ledger` — propaga `company_id`.
- `nfe_authorized_to_ar` — propaga `company_id`.
- `notify_critical_brain_decision` — notifica apenas admins do mesmo tenant.
- `fraud_check_ledger_insert` — usa `NEW.company_id`.
- `update_bank_balance_from_ledger` — bloqueia mutação cross-tenant.
- `fn_audit_sensitive_mutation` — mapeia `company_id` corretamente p/ tabela `companies`.

## 7. Input hardening (client)

- `src/lib/numericValidation.ts` — parsing pt-BR/en-US, rejeita NaN/negativos.
- `src/lib/fileValidation.ts` — MIME + extensão + tamanho nos 3 inputs de upload.
- `src/lib/toastHelpers.ts` — `sanitizeErrorMessage` filtra leaks de RLS/SQL.
- `src/components/shared/NumericInput.tsx` — componente controlado.
- ~60 ocorrências de `Number(e.target.value)` substituídas por `toSafeNumber`.

## 8. UI / Rotas

- `<RoleGuard>` em 11 rotas `/admin/*`.
- `<Can>` para botões/ações granulares via `has_permission`.
- `dangerouslySetInnerHTML`: única ocorrência é shadcn chart (CSS estático).
- Links externos com `rel="noopener noreferrer"`.

## 9. Headers de segurança (`index.html`)

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy` restritivo
- CSP: aplicar no edge/CDN do deploy (não via meta para preservar HMR).

## 10. Supply chain

- `npm audit`: **0 high/critical**.
- `react-router-dom@7.18.0`, `recharts@3.9.0` (Ciclo 39).

## 11. Storage (LGPD)

- Único bucket: `avatars` (público com path-isolation por `auth.uid()` no path).
- Retenção: `purge_old_logs_all()` diário em 14 tabelas de logs.

---

## Findings residuais do linter (não-bloqueantes)

| Tipo | Qtd | Justificativa |
|---|---|---|
| INFO RLS sem policy | 1 | Tabela legada, RLS bloqueia tudo por default |
| WARN SECURITY DEFINER → authenticated | 26 | RPCs validators legítimas |
| WARN OTP/password policy | 2 | Painel Cloud — fora do escopo `configure_auth` |

## Itens recomendados para o operador

1. **Painel Cloud → Auth**: reduzir OTP expiry para ≤900s e min password length para ≥10.
2. **Edge/CDN**: aplicar CSP estrita em produção (script-src 'self' + Supabase host).
3. **Pen-test** externo após próximas releases de Workflow v2 / Marketplace.

---

**Próximo passo sugerido**: Fase 2 — Workflow Engine v2 + Marketplace de Plugins, OU expansão vertical (Construção/Agro). Aguardando direção do operador.
