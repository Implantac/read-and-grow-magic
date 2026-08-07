# Baseline de Hardening - READ & GROW
Data: 2026-08-06
Status: **FASE 8 CONCLUÍDA** | **FASE 9 PLANEJADA**

## Status do Hardening
| Fase | Descrição | Status |
| :--- | :--- | :--- |
| 0 | Baseline e Checkpoint | ✅ Concluído |
| 1 | Mapa Arquitetural | ✅ Concluído |
| 2 | Segurança e Multi-tenant | ✅ Concluído |
| 3 | RLS Hardening & Type Safety | ✅ Concluído |
| 4 | Auditoria de Logs & Transações (Hardening IDOR) | ✅ Concluído |
| 5 | Edge Functions (Hardening) | ✅ Concluído |
| 6 | Idempotência & Resiliência Financeira | ✅ Concluído |
| 7 | Autorização Granular (RBAC Hardening) | ✅ Concluído |
| 26 | Governança (DoD) | ✅ Concluído |


## Ações Executadas
- [x] Documentação de Arquitetura em `docs/architecture/ARCHITECTURE.md`.
- [x] Definição de Governança em `docs/governance/DEFINITION_OF_DONE.md`.
- [x] Padronização de UX em `docs/ux/COMPONENTS.md`.
- [x] Hardening de RLS para NFe, NFCe e Tax Rules (Migração `20260806160000_fiscal_rls_hardening.sql`).
- [x] Atualização do `TENANT_MATRIX.md` com status de isolamento fiscal.
- [x] Hardening IDOR (Fase 4): Reforço de `company_id` em mutações (Delete/Update) nos hooks de NPS e ERP.
- [x] Hardening de Edge Functions (Fase 5): Padronização de CORS, centralização de Auth (Service Role/Cron/Internal Secret) e sanitização de inputs públicos.
- [x] Idempotência (Fase 6): Criada tabela \`idempotency_keys\` e utilitário compartilhado em Edge Functions. Aplicada proteção em \`billing-checkout\`, \`financial-intelligence\` e hooks de boletos.
- [x] Autorização Granular (Fase 7): Implementada infraestrutura de permissões baseada em recursos/ações (\`permissions\` e \`role_permissions\`). Criada função RPC \`has_permission\` com Security Definer para validação server-side.

## Ações Imediatas
1. Stress test em PDV Offline (Fase 11/12).
2. Hardening de Idempotência em Pagamentos (Fase 8).

