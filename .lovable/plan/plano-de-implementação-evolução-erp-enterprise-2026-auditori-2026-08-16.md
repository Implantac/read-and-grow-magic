# Plano de Implementação: Evolução ERP Enterprise 2026 - Auditoria & Hardening

Este plano foca na estabilização do Core e no Hardening de Segurança/Banco de Dados após a auditoria profunda.

## Fase 1: Hardening de Segurança & RLS (P0)
- **Objetivo**: Eliminar redundâncias e garantir isolamento multitenant imutável.
- **Ações**:
    - Consolidar RLS de `orders` e `nfe` (reduzir de 9 para 4 políticas padrão).
    - Padronizar casts para `app_role` em todas as funções `SECURITY DEFINER`.
    - Revisar `check_hierarchy_access` para suportar consolidação via `tenant_id`.

## Fase 2: Integridade de Dados & Ledger (P0)
- **Objetivo**: Garantir traceabilidade total e prevenir estados inválidos.
- **Ações**:
    - Implementar trigger de trava de estoque negativo sincronizada com o `PolicyEngine`.
    - Adicionar `correlation_id` em tabelas faltantes (auditoria final em `financial_ledger`).
    - Criar índices de performance para `correlation_id` e `company_id`.

## Fase 3: Governança de Funções (P1)
- **Objetivo**: Padronizar privilégios de funções críticas.
- **Ações**:
    - Revisar `GRANT` em funções `SECURITY DEFINER` para evitar vazamento de privilégios.
    - Documentar o fluxo de `stock_ledger_bypass` para auditoria de WMS.

## Fase 4: UX Prescritiva & Consolidação (P2)
- **Objetivo**: Expandir o cockpit "Minha Loja" com dados de saúde do sistema.
- **Ações**:
    - Integrar `run_financial_audit` e `audit_stock_integrity` no painel executivo.
    - Implementar alertas de segurança (tentativas de acesso cross-tenant) no dashboard.

---
*Status: Aguardando aprovação para execução da migração de Hardening.*
