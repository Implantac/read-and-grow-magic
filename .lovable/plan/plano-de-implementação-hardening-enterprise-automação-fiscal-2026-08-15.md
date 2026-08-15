# Plano de Implementação - Hardening Enterprise & Automação Fiscal

Este plano detalha a consolidação da Fase 1 (Core) e o início da Fase 4 (Orquestração Cross-Module) com foco em automação fiscal e cockpit operacional.

## 1. Hardening do Motor de Políticas (Core)
- [x] Expansão do `ERPPolicy` para incluir `taxRegime` e `autoTransferInvoice`.
- [x] Sincronização de flags no `PolicyEngine`.

## 2. Orquestração Logística-Fiscal (P4)
- [x] Atualização do `useEventBus` com evento `FISCAL_OPERATION_REQUESTED`.
- [x] Implementação de gatilho em `InventoryOrchestrator` para disparar evento fiscal no status "EM TRÂNSITO".
- [x] Propagação de `correlationId` no `transferWorkflow`.
- [ ] Implementação do `FiscalOrchestrator` para assinar `FISCAL_OPERATION_REQUESTED` e gerar NF-e automática via `FiscalService`.

## 3. Consolidação do Cockpit "Minha Loja" (UX)
- [x] Refatoração visual do `StoreCentral.tsx` para foco em exceções.
- [ ] Integração de KPIs de "Ruptura Iminente" baseados no motor de sugestão.
- [ ] Adição de widget de "Documentos Fiscais Pendentes" para transferências em trânsito.

## Detalhes Técnicos
- **Correlation Chain**: `Transfer Action` -> `EventBus: WORKFLOW_COMPLETED` -> `InventoryOrchestrator` -> `EventBus: FISCAL_OPERATION_REQUESTED` -> `FiscalOrchestrator` -> `Supabase: nfe`.
- **Traceability**: Garantir que a NF-e gerada herde o `correlation_id` do movimento original.
