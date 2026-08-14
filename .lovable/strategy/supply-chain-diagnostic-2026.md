# Diagnóstico Funcional e Arquitetural: Ecossistema de Abastecimento e Lojas

## A. FLUXO ATUAL
Atualmente, o sistema possui funcionalidades robustas, mas fragmentadas:
1. **Loja**: A `StoreCentral.tsx` já centraliza KPIs e alguns alertas, mas as ações (receber, transferir) levam o usuário para módulos externos (`/logistica/...`).
2. **Abastecimento**: O `SmartReplenishment.tsx` gera sugestões inteligentes (surplus/ruptura), mas foca em uma visão de "grade" e aprovação em lote, sem conexão direta com o workflow de tarefas da loja.
3. **Transferência**: Já existe um workflow completo em `StockTransfers.tsx` (10 etapas), mas ele é visto como uma "lista de documentos" e não como uma "fila de tarefas operacionais".
4. **Estoque**: Dividido entre `Inventory` (estático/Kardex) e `WMS` (operacional).

## B. FLUXO IDEAL (Central de Abastecimento)
Um ecossistema unificado onde a unidade operacional (Loja/CD) é o protagonista:
- **Central de Tarefas**: O usuário não procura a tela de transferência; ele vê uma tarefa "Receber TR-001" na sua Central.
- **Abastecimento Preditivo**: O sistema sugere reposição automaticamente baseada em políticas de SKU x Local, considerando o "Estoque Projetado" (Físico + Trânsito - Reserva).
- **Logística Rastreável**: Cada passo do workflow de transferência atualiza o Ledger e os estados de estoque (Reservado -> Trânsito -> Disponível) de forma imutável.

## C. GAPS IDENTIFICADOS
1. **Integração de Ações**: A `StoreCentral` exibe alertas, mas o tratamento dessas exceções exige navegação entre módulos.
2. **Visão de Trânsito**: A loja tem dificuldade de visualizar o que "está vindo" de forma detalhada para planejar o recebimento.
3. **Automação de Origem**: O sistema de reposição atual é manual/semi-automático; falta a inteligência de decidir se tira do CD ou faz balanceamento entre lojas vizinhas (Surplus vs Ruptura).
4. **Reserva de Estoque**: A lógica de reserva em `transferWorkflow.ts` está implementada via RPC, mas o impacto visual no "Disponível" para o vendedor no PDV precisa ser blindado.

## D. DUPLICIDADES
- Serviços de estoque em `inventoryService.ts` e `wmsService.ts` podem ser consolidados em um `SupplyChainService` unificado.
- Lógica de "Alertas" na Loja vs "Notificações" de WMS.

## E. REAPROVEITAMENTO (O que já é excelente)
- **Engine de Cálculo**: `stockEngine.ts` é preciso e deve ser o coração de todas as telas.
- **Workflow Engine**: `transferWorkflow.ts` já possui as 10 etapas solicitadas, precisando apenas de expansão de UI.
- **Enterprise Context**: A infraestrutura de Multi-Tenant e RBAC já garante isolamento.

## F. FUNCIONALIDADES A CRIAR
1. **Fila de Tarefas Operacionais**: Um painel de execução ("Minhas Tarefas") para operadores de loja e CD.
2. **Monitor de Ruptura Preditiva**: Dashboard para gestores regionais visualizarem riscos antes que aconteçam.
3. **Conciliador de Divergências**: Interface específica para tratar os logs de divergência gerados no workflow de recebimento.

## G. ROADMAP PRIORIZADO (P0-P3)

### P0 — Fundação e Rastreabilidade
- Unificar o uso do `supply_chain_ledger` para todos os módulos.
- Garantir que `adjust_stock` reflita corretamente os estados (Físico, Reservado, Trânsito).

### P1 — Central da Unidade (Operação Unificada)
- Evoluir `StoreCentral.tsx` para permitir ações diretas (Recebimento, Contagem, Perda) sem sair da tela.
- Implementar a "Visão de Trânsito" detalhada para a Loja.

### P2 — Motor de Abastecimento Autônomo
- Integrar `SmartReplenishment` com as políticas de SKU x Local.
- Adicionar lógica de prioridade de rede (Loja vizinha > CD > Fábrica).

### P3 — Visão Executiva e Exceções
- Criar o Dashboard de Rede para Gestores (Visão de Rupturas e Atrasos Consolidados).
- Relatórios de performance de abastecimento e lead time real.
