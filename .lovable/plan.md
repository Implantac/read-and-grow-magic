# Plano de Estabilização Final — Read & Grow

Este plano visa resolver definitivamente o erro **React #185 (Maximum update depth exceeded)** e os loops de "Subscribe/Unsubscribe" que continuam ocorrendo entre os orquestradores de módulos (`InventoryOrchestrator`, `FinancialOrchestrator`) e a infraestrutura de eventos.

## Problema Identificado
O log mostra que o `RealtimeAlertsBridge` está sendo re-inicializado repetidamente, o que causa um ciclo de montagem e desmontagem dos orquestradores. Isso ocorre porque o `useEnterprise()` está disparando atualizações de estado que não são bloqueadas por verificações de igualdade profunda o suficiente, ou porque hooks internos estão acessando o contexto de forma que força a re-renderização do componente pai.

## Ações Técnicas

### 1. Refatoração do RealtimeAlertsBridge no App.tsx
- Substituir o componente `RealtimeAlertsBridge` por uma estrutura que utilize o ID da empresa de forma mais estável.
- Mover a lógica de inicialização dos orquestradores para dentro de um hook dedicado ou componente que não seja afetado por atualizações menores do `EnterpriseContext`.

### 2. Blindagem de Igualdade nos Orquestradores
- Atualizar `InventoryOrchestrator.ts` e `FinancialOrchestrator.ts` para garantir que o efeito de subscrição seja disparado **apenas** quando o `companyId` realmente mudar e o carregamento do contexto estiver completo.
- Remover dependências desnecessárias dos arrays de dependência do `useEffect`.

### 3. Otimização do EnterpriseContext.tsx
- Refinar as funções de atualização de estado para serem ainda mais agressivas na prevenção de re-renderizações desnecessárias.
- Garantir que `isLoading` não oscile de forma que quebre a estabilidade dos hooks dependentes.

### 4. Event Bus Cleanup
- Garantir que o `useEventBus` não mantenha referências obsoletas ou cause subscrições duplicadas durante transições rápidas de estado.

## Verificação
- Utilizar Playwright para monitorar os logs do console por 30 segundos.
- Confirmar que as mensagens "Subscribing/Unsubscribing" aparecem apenas uma vez por login/troca de empresa.
- Validar que o erro #185 não ocorre mais sob condições de carga ou transições de rota.

---
Este plano segue a diretriz **Software House Profissional**, priorizando a estabilidade do ecossistema sobre correções superficiais.