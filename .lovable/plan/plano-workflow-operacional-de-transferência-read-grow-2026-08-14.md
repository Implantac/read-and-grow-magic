# Plano: Workflow Operacional de Transferência Read & Grow

Este plano implementa o rastreamento completo do ciclo de vida de uma transferência de estoque, desde a sugestão até o encerramento, com registro de auditoria em cada etapa.

## Camada de Dados (Database)

1.  **Migração SQL**:
    *   Criar enum `transfer_workflow_status`: `SUGERIDA`, `APROVADA`, `RESERVADA`, `SEPARAÇÃO`, `CONFERÊNCIA`, `EXPEDIDA`, `EM TRÂNSITO`, `RECEBIDA`, `CONFERIDA`, `ENCERRADA`.
    *   Criar tabela `stock_transfer_workflow_logs` para registrar o histórico (usuário, data, status, quantidade, divergência, observação).
    *   Adicionar coluna `current_status` na tabela `stock_transfer_orders`.
    *   Configurar RLS e Grants para as novas estruturas.

## Camada de Aplicação (Frontend)

1.  **Serviço de Transferência**:
    *   Criar `src/services/operational/inventory/transferWorkflow.ts` para gerenciar as transições de estado e logs.
2.  **Interface de Workflow**:
    *   Atualizar `src/modules/operational/network/StockTransfers.tsx` para incluir um componente de "Linha do Tempo" ou "Stepper" operacional.
    *   Adicionar diálogos para ações específicas (ex: registrar divergência no recebimento, confirmar expedição).
3.  **Audit Log UI**:
    *   Exibir o histórico de movimentações dentro do detalhe da transferência.

## Detalhes Técnicos
*   Uso de `SECURITY DEFINER` para garantir que as atualizações de estoque (reserva/baixa/entrada) ocorram de forma atômica com a mudança de status.
*   Integração com o `stockEngine.ts` já existente para atualizar `reserved_quantity` e `in_transit_in_quantity`.
