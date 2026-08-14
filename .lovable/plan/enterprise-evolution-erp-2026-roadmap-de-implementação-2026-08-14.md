# Enterprise Evolution ERP 2026 - Roadmap de Implementação

Este plano detalha a evolução do sistema para uma arquitetura Enterprise robusta, focada em rastreabilidade, políticas centralizadas e blindagem de dados.

## Fase 1: Core & Contracts (CONCLUÍDO)
- [x] **Policy Engine**: Centralização das regras de negócio por tenant.
- [x] **Event Bus Hardening**: Suporte a `correlationId` e `causationId`.
- [x] **Ledger Hardening**: Migração de banco para suportar rastreabilidade imutável cross-module.
- [x] **EnterpriseContext Optimization**: Remoção de ciclos de renderização.

## Fase 2: Inventory SSOT (Single Source of Truth) (EM CURSO)
- [ ] **Unified Inventory Orchestrator**: Centralizar toda a lógica de estoque que hoje está espalhada em múltiplos hooks.
- [ ] **Ledger Integration**: Garantir que toda movimentação de estoque passe pelo `supply_chain_ledger`.
- [ ] **Correlation Propagation**: Integrar o `correlationId` nos fluxos de Venda (O2C) e Compra (P2P).

## Fase 3: Logistics Ledger & Traceability
- [ ] **Immutable Logistics Log**: Implementação de logs de auditoria imutáveis para toda a malha logística.
- [ ] **Transfer Approval Workflow**: Fluxo de aprovação baseado nas políticas do `PolicyEngine`.

## Detalhes Técnicos
- **Stack**: React 18 + Supabase + Zustand.
- **Padrão**: Event-Driven Architecture (EDA).
- **Segurança**: RLS Nível 4 + Auditoria por Correlation ID.
