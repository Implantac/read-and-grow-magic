# Plano de Implementação - Evolução ERP Enterprise (Fase 3 & 4)

## Status Atual
- **Fase 1 (Core & Contracts)**: Concluída. PolicyEngine e EventBus estabilizados.
- **Fase 2 (Inventory SSOT)**: Concluída. `InventoryOrchestrator` centraliza movimentações e ledger imutável.
- **Fase 3 (Logistics Ledger & Traceability)**: Concluída. Rastreabilidade via `correlation_id` implementada em transferências e ledger.
- **Fase 4 (Logistic-Fiscal Orchestration)**: Em andamento. Integração logística -> fiscal via orquestradores validada em arquitetura.

## Próximos Passos (Imediato)
1. **Estabilização de Testes de Integração**: Resolver flutuações de tempo no ambiente de teste Vitest para o fluxo assíncrono Logistic-Fiscal.
2. **Hardening de RLS**: Garantir que o `correlation_id` seja obrigatório em todas as inserções no `supply_chain_ledger`.
3. **Consolidação UX na "Minha Loja"**: Melhorar o feedback visual de documentos fiscais gerados automaticamente na aba "Fiscal".

## Detalhes Técnicos
- **Traceability Chain**: `useSupplyChainExecution` -> `transferWorkflow` -> `InventoryOrchestrator` -> `FiscalOrchestrator` -> `nfe` (database).
- **Event Orchestration**: Uso de `WORKFLOW_COMPLETED` e `FISCAL_OPERATION_REQUESTED` para desacoplamento entre Logística e Fiscal.
- **Policy Driven**: A emissão automática respeita a política `autoTransferInvoice`.
