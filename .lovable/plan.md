# Plano de Expansão: Torre de Controle e Inteligência de Abastecimento

Este plano estabelece a base para transformar o ERP em um **Sistema Inteligente de Abastecimento de Rede**, unificando o fluxo de Lojas, CDs e Indústria sob uma única lógica operacional.

## Ações de Engenharia

### 1. Núcleo de Dados (Posição de Estoque)
- **Hardening do Banco**: Implementação de campos de reserva, trânsito e curva ABC na tabela `stock_balances`.
- **Lógica Unificada**: Criação de helper centralizado em `src/services/operational/inventory/stockEngine.ts` para cálculo de:
  - `Disponível = Físico - Reservado`
  - `Projetado = Físico - Reservado + Em Trânsito`
  - `Cobertura = Projetado / Venda Média`

### 2. Interface: Torre de Controle (Dashboard)
- Criar `src/modules/operational/network/SupplyChainTower.tsx` como ponto de entrada principal.
- Widgets de visão consolidada:
  - **Rupturas**: Itens com saldo zero ou abaixo do nível crítico.
  - **Atrasados**: Transferências com lead time extrapolado.
  - **Sugestões**: Oportunidades de balanceamento identificadas pela IA.
  - **Prioridades**: Ranking de lojas/SKUs com maior risco financeiro de ruptura.

### 3. Motor de Decisão e Simulação
- Evoluir o `SmartReplenishment` para:
  - **Análise de Excesso**: Identificar lojas com surplus (Cobertura > 15 dias) para balanceamento.
  - **Simulador**: Interface para testar o impacto de uma transferência antes da execução.
  - **ABC Sensitivity**: Aplicar políticas mais agressivas para itens Classe A.

### 4. Workflow Operacional Auditável
- Refatorar o ciclo de vida das transferências (`src/modules/logistics/transfers`) para incluir estados de conferência e divergência.
- Implementar diálogo de "Explicação de Decisão" (IA Explicável).

## Detalhes Técnicos
- **Tenant Isolation**: Garantir que o cálculo de rede respeite o `company_id`.
- **Performance**: Utilizar visualização pivotada e caches em memória para cálculos de cobertura em massa.
- **Divergência**: Nova tabela `operational_discrepancies` para auditoria de perdas em trânsito.
