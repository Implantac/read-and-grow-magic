# Plano de Expansão e Refinamento UX — Fase 4: Consolidação O2C e P2P

Este plano detalha a continuidade da **Fase 4**, focando na integração profunda entre os fluxos de Vendas (Order-to-Cash) e Compras (Procure-to-Pay), garantindo que a inteligência logística e o compliance (UEEF SEC-LEVEL 3) estejam presentes em cada etapa.

## Objetivos
- Consolidar o **OrderWizard** com validações de compliance em tempo real.
- Implementar o **ProcurementDashboard** para automação de compras (MRP).
- Integrar o **ComplianceService** no fluxo de aprovação de pedidos.
- Refinar a UX dos módulos operacionais com feedbacks contextuais.

## Ações Propostas

### 1. Consolidação Comercial (O2C)
- **Hardening do OrderWizard**: Integrar o `ComplianceService` para validar a integridade da margem e disponibilidade (ATP) antes da finalização.
- **Fluxo de Aprovação**: Adicionar verificação automática de regras de negócio (desconto excessivo, crédito bloqueado) no `OrderWizard`.

### 2. Automação de Compras (P2P)
- **Criação do Dashboard de Compras**: Implementar `src/pages/purchasing/ProcurementDashboard.tsx` utilizando o `ProcurementAutomationService` para sugerir compras baseadas em estoque mínimo e lead time.
- **Workflow de Sugestão**: Permitir que o comprador transforme sugestões de ruptura em Pedidos de Compra (POs) com um clique.

### 3. Governança e Compliance (UEEF SEC-LEVEL 3)
- **Hook de Compliance**: Criar `src/hooks/compliance/useComplianceValidation.ts` para facilitar o uso do serviço de compliance em múltiplos módulos.
- **Logs de Auditoria**: Garantir que toda criação de pedido e ajuste de estoque seja registrado no `security_audit_logs`.

### 4. Refinamento de Interface
- **Feedback Operacional**: Padronizar o uso de `EmptyState` e `OperationalFeedback` nos módulos de Compras e Financeiro.
- **Status Lifecycle**: Atualizar o `UnifiedSupplyChain` para refletir as novas transições de estado do Ledger Logístico.

## Detalhes Técnicos
- **MRP Engine**: O `ProcurementAutomationService` será expandido para considerar previsões de demanda (Digital Twin base).
- **Relação Logistics-Financial**: O trigger `tr_supply_chain_ledger` será o guardião da integridade imutável no banco de dados.
- **Tipagem**: Eliminação total de `as any` nos serviços de `orderService` e `procurementService`.
