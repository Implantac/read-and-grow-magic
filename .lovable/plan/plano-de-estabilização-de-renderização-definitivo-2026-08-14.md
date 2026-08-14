# Plano de Estabilização de Renderização (Definitivo)

O sistema apresenta instabilidade intermitente (React Error #185) causada por ciclos de sincronização entre o Provedor de Contexto Empresarial e os Stores de Estado (Zustand). Este plano visa consolidar a "Fonte da Verdade" e eliminar redundâncias que provocam re-renderizações circulares.

## Auditoria de Causas Raiz

1.  **Duplicação de Estado**:
    *   `useAppStore`: Armazena `activeCompany`, `activeBranch`.
    *   `useEnterpriseStore`: Armazena `activeCompanyId`, `activeBranchId`.
    *   `EnterpriseContext`: Mantém `currentCompany`, `currentBranch`.
2.  **Ciclo Identificado**:
    `EnterpriseContext` (Effect) -> Sincroniza `AppStore` e `EnterpriseStore` -> `AppStore` muda -> Componentes que consomem `AppStore` renderizam -> `EnterpriseProvider` (filho do root) pode re-renderizar se houver dependências incorretas -> Reinicia o loop.
3.  **Referência Instável**: `useAdaptiveInterface` gera um novo array `visibleModules` em cada execução, o que pode causar re-renderizações em componentes que o utilizam como dependência.

## Ações Técnicas

### 1. Estabilização do Monitor de Diagnóstico
*   **Arquivo**: `src/core/debug/RenderDepthMonitor.ts`
*   **Mudança**: Transformar em ferramenta estritamente de diagnóstico. Remover o `throw error` em produção para evitar que o monitor se torne o próprio causador de loops ao tentar interrompê-los agressivamente.

### 2. Unificação da Autoridade de Contexto
*   **Arquivo**: `src/core/auth/EnterpriseContext.tsx`
*   **Mudança**: Implementar uma trava de sincronização baseada em comparação profunda (Deep Equality). Garantir que `loadActiveTenant` não execute se os dados já estiverem consistentes.
*   **Ação**: Remover a sincronização síncrona com `useEnterpriseStore` de dentro do `loadActiveTenant`. O contexto deve ser a autoridade que os stores refletem apenas quando há mudança real iniciada pelo usuário.

### 3. Estabilização de Referências Adaptativas
*   **Arquivo**: `src/core/hooks/useAdaptiveInterface.ts`
*   **Mudança**: Utilizar `useMemo` com dependência estável no `config.segment` para garantir que `visibleModules` mantenha a mesma referência de memória entre renders se os dados não mudarem.

### 4. Orquestradores Assíncronos
*   **Arquivos**: `InventoryOrchestrator.ts`, `FinancialOrchestrator.ts`
*   **Mudança**: Garantir que as subscrições ao `EventBus` sejam limpas corretamente e que o processamento seja sempre desacoplado via `setTimeout(0)` ou `queueMicrotask`, evitando que uma orquestração dispare um render síncrono no meio de outro render.

### 5. Blindagem do App.tsx
*   **Arquivo**: `src/App.tsx`
*   **Mudança**: Isolar os Orquestradores em um componente que consuma apenas o ID estável da empresa, garantindo que mudanças em outros campos do contexto não reiniciem os hooks de realtime.

## Validação

1.  **Execução de Auditoria Automática**: Rodar script Playwright para monitorar logs de renderização por 30 segundos.
2.  **Verificação de Build**: `npm run build` para garantir que as alterações não quebraram o bundle.
3.  **Teste de Fluxo**: Alternar entre empresas e filiais no menu e verificar se o estado estabiliza sem erros no console.
