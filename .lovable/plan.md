# Plano de Consolidação: Central de Abastecimento e Ecossistema de Lojas

Este plano detalha a reestruturação dos processos de gestão de lojas, estoque, transferências e reabastecimento para transformar o sistema em um ecossistema operacional unificado.

## Diagnóstico Funcional
- **Fluxo Atual**: Fragmentado entre `StoreCentral`, `SmartReplenishment` e `StockTransfers`.
- **Gaps**: Falta de visão unificada de tarefas na loja e rastreabilidade total do trânsito de estoque.
- **Oportunidade**: Consolidar a unidade operacional (Loja/CD) como o centro de todas as ações logísticas.

## Etapas de Implementação

### 1. P0 — Fundação e Rastreabilidade
- **Objetivo**: Garantir que cada movimentação de estoque atualize o Ledger e os estados corretos (Reservado, Trânsito, Físico).
- **Ações**:
  - Validar a função `adjust_stock` para suportar reservas e trânsito de forma atômica.
  - Reforçar o uso do `supply_chain_ledger` em todas as transações de transferência.

### 2. P1 — Central da Unidade (Operação Unificada)
- **Objetivo**: Transformar a `StoreCentral.tsx` em um cockpit de execução.
- **Ações**:
  - Adicionar aba "Minhas Tarefas" integrando recebimentos pendentes e solicitações.
  - Criar visão detalhada de "Estoque em Trânsito" para a unidade destino.
  - Integrar ações de contagem e registro de perdas diretamente no contexto da loja.

### 3. P2 — Abastecimento Inteligente e Autônomo
- **Objetivo**: Automatizar a geração de sugestões de reposição baseada em políticas SKU x Local.
- **Ações**:
  - Vincular o motor de cálculo `stockEngine.ts` às `replenishment_policies`.
  - Implementar lógica de decisão de origem (CD vs Balanceamento entre lojas).

### 4. P3 — Visão Executiva de Rede
- **Objetivo**: Prover visibilidade consolidada para o gestor regional.
- **Ações**:
  - Dashboard de exceções com indicadores de rupturas críticas, atrasos e divergências em toda a rede.

## Detalhes Técnicos
- **Entidades**: `stock_transfer_orders`, `stock_balances`, `supply_chain_ledger`.
- **Workflow**: 10 etapas (SUGERIDA até ENCERRADA) gerenciadas por `transferWorkflow.ts`.
- **UX**: Interface Premium Dark Mode com foco em legibilidade e redução de cliques.

## User Review Required
> [!IMPORTANT]
> Este plano foca na consolidação de funcionalidades existentes. Nenhuma mudança de código será feita antes da aprovação deste diagnóstico e roadmap.

Deseja prosseguir com a implementação da fase **P0 — Fundação e Rastreabilidade**?
