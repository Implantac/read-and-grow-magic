# Plano de Estabilização e Auditoria do Motor de Abastecimento

Este plano foca em consolidar o fluxo de abastecimento de ponta a ponta, eliminando regras de negócio simplificadas (como a divisão do estoque mínimo pelo número de lojas) e removendo indicadores estáticos (hardcoded) nas telas operacionais.

## Ações Propostas

### 1. Reestruturação do Motor de Abastecimento (Stock Logic)
- **Matriz de Estoque**: Remover o cálculo `min_stock / branches.length`. O sistema passará a buscar políticas específicas por filial (tabela `replenishment_policies`).
- **Cálculo de Necessidade**: Evoluir a lógica de `quantity < min_stock` para considerar o "Estoque Projetado" (Físico - Reservas + Em Trânsito).
- **Priorização**: Implementar o fluxo de decisão sugerido pelo usuário: Balanceamento entre lojas -> CD -> Indústria -> Compra.

### 2. Eliminação de KPIs Hardcoded
- **Central da Loja**: Substituir valores estáticos (ex: "2 Em Trânsito", "02/14 Posição") por consultas reais agregadas no `storeService`.
- **Inteligência de Reposição**: Vincular os cards de resumo aos dados reais de `replenishment_policies` e `stock_transfer_orders`.

### 3. Melhoria na Precisão dos Dados
- **Acuracidade e Saúde**: Refinar os scores de saúde operacional baseando-se em tarefas pendentes reais e divergências de inventário.
- **Diferenciação de Fluxos**: Separar visualmente o reabastecimento WMS (Pulmão -> Picking) da reposição de rede (CD -> Loja).

## Detalhes Técnicos

### Backend / Database
- Utilizar a tabela `replenishment_policies` para armazenar `min_stock`, `max_stock`, `reorder_point`, `safety_stock` e `lead_time` por SKU e filial.
- Criar funções de agregação para calcular o estoque disponível real: `quantity - reserved`.

### Frontend / Services
- **src/services/operational/store/storeService.ts**: Adicionar métodos para buscar contagens reais de itens em trânsito e rupturas.
- **src/modules/wms/EstoqueMatrix.tsx**: Alterar a visualização de severidade para usar as políticas específicas de cada filial.
- **src/modules/wms/components/SmartReplenishment.tsx**: Refatorar o algoritmo de sugestão para usar o novo motor de necessidade.

### Validação
- Testar o fluxo completo em ambiente de desenvolvimento.
- Verificar se os indicadores refletem as alterações no banco de dados em tempo real.
