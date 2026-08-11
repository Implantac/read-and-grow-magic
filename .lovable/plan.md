# Plano de Expansão e Refinamento UX — Fase 4

Este plano foca na consolidação dos fluxos O2C (Order-to-Cash) e P2P (Procure-to-Pay), elevando a maturidade do sistema para um nível Enterprise através de Wizards inteligentes e automações de retaguarda.

## Objetivos
- **Consolidação O2C**: Implementar o Wizard de Vendas multi-etapas com validação em tempo real de margem e impostos.
- **Refinamento P2P**: Automatizar a geração de pedidos de compra baseada em ruptura de estoque (MRP básico).
- **UX Operacional**: Introduzir componentes de feedback proativo para ações críticas.
- **Governança**: Estender o Ledger Logístico para transações financeiras vinculadas à movimentação.

## Detalhes Técnicos

### 1. Wizard de Vendas (O2C)
Refatorar a criação de pedidos para um componente `OrderWizard` que guia o usuário:
- **Etapa 1**: Identificação do Cliente e Unidade de Origem (Sourcing).
- **Etapa 2**: Seleção de Itens com visibilidade de estoque real em toda a rede.
- **Etapa 3**: Condições de Pagamento e Simulação de Margem Líquida.
- **Etapa 4**: Revisão Fiscal (integração com `tax_rules`).

### 2. Automação P2P (Procure-to-Pay)
- Criar serviço de sugestão de compras baseado em `min_stock` e `lead_time`.
- Implementar fluxo de aprovação de PO (Purchase Order) com limites por perfil (RBAC).

### 3. Ledger de Valor
- Vincular eventos do `supply_chain_ledger` a entradas no `ledger_financeiro`.
- Garantir que toda baixa de estoque gere o respectivo custo (COGS) de forma imutável.

### 4. Interface (UI/UX)
- Padronizar o uso de `EmptyState` e `OperationalFeedback` em todos os módulos.
- Implementar "Actionable Dashboards" na Torre de Controle, onde alertas permitem ação imediata (ex: "Aprovar Transferência Atrasada").

## Próximos Passos
1. Implementar o `OrderWizard` em `src/modules/commercial/orders/components/OrderWizard.tsx`.
2. Criar o serviço `ProcurementAutomationService.ts`.
3. Atualizar o `ComplianceService` para validar a integridade entre logística e financeiro.
