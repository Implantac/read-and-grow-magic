# Plano de Implementação: Testes E2E e Rastreabilidade Logistic-Fiscal

Este plano estabelece a estratégia para validar o fluxo completo de transferência até a emissão da NF-e na "Minha Loja", garantindo a integridade do `correlation_id`.

## Objetivos
- Validar a automação da emissão de NF-e a partir de transferências.
- Garantir que o `correlation_id` seja preservado em toda a cadeia de eventos.
- Implementar testes de integração robustos para o ecossistema enterprise.

## Detalhes Técnicos
- **Fluxo de Dados**: `useSupplyChainExecution` -> `transferWorkflow` -> `InventoryOrchestrator` -> `Event Bus (FISCAL_OPERATION_REQUESTED)` -> `FiscalOrchestrator` -> `public.nfe`.
- **Validação**: Verificação via Vitest da propagação do `correlation_id` no barramento de eventos.
- **UI**: Exibição do status fiscal na "Central da Loja" (StoreCentral.tsx) vinculada ao ID de correlação.

## Cronograma
1. **Fase 1**: Refinamento do `FiscalOrchestrator` para suporte a rascunhos automáticos (Concluído).
2. **Fase 2**: Implementação de testes de integração em `src/core/orchestration/logistic-fiscal-traceability.test.ts`.
3. **Fase 3**: Auditoria de logs do Ledger para validação de imutabilidade.
