# Plano de Reestruturação: Sistema Operacional da Unidade (SOU)

Este plano visa transformar a experiência de "Loja" em um verdadeiro sistema operacional integrado, eliminando silos entre Estoque, WMS, Logística e PDV, focando na realidade operacional do gerente e do operador da unidade.

## Alterações Técnicas

### Camada de Domínio e Dados
- **Unificação do Domínio**: Tratar a "Loja" como `Unidade Operacional` (com tipos: Loja, CD, Fábrica, etc.).
- **Hardening de Dados**: Eliminar mocks no `storeService`, integrando KPIs diretamente com as tabelas `orders`, `stock_balances` e `operational_tasks`.
- **Novas Operações no Service**: Adicionar métodos para fluxos completos: `startReceiving`, `registerLoss`, `startInventory`, etc.

### Frontend e UX
- **Reconstrução da Central da Loja**: Transformar o dashboard atual em um "Cockpit Operacional" focado em ações e exceções.
- **Timeline da Unidade**: Implementar um log visual de eventos em tempo real para a unidade selecionada.
- **Refatoração de Operações**: 
  - Separar conceitualmente "Solicitação de Reposição" de "Transferência entre Unidades".
  - Implementar modais operacionais para Inventário, Perda/Avaria e Divergência, conectando-os ao backend.
- **Níveis de Acesso**: Ajustar interfaces para Operador (tarefas), Gerente (exceções/cockpit) e Regional (comparativo de rede).

### Integrações
- **Orquestração**: A Loja passa a ser a interface que orquestra comandos para os módulos de Estoque, WMS e Logística por baixo do capô.

## Detalhes Técnicos

- Atualizar `src/services/operational/store/storeService.ts` para usar queries reais do Supabase.
- Refatorar `src/modules/operational/store/StoreCentral.tsx` para o novo layout de Cockpit.
- Expandir `src/modules/store-operations/StoreOperations.tsx` para suportar todos os 6 fluxos operacionais com componentes reais.
- Garantir que as tabelas `operational_tasks` e `operational_discrepancies` sejam alimentadas corretamente por cada ação.

## Benefícios
- Redução da carga cognitiva: o usuário não precisa saber em qual módulo a função reside.
- Maior acuracidade: dados reais em tempo real em vez de indicadores estáticos.
- Fluxos ponta-a-ponta: do recebimento à conferência com tratamento de divergência.
