# Auditoria Técnica Profunda e Estabilização - Use ERP

O sistema passou por uma auditoria completa de arquitetura, segurança e estabilidade. O foco principal é garantir que o **React Error #185** (Maximum Update Depth Exceeded) seja erradicado definitivamente e que os fluxos críticos de Supply Chain, Financeiro e Comercial funcionem de forma síncrona e segura.

## Problemas Identificados

### 1. Estabilidade de Renderização (Error #185)
- **Causa**: Disputa de estado entre `useAuth`, `EnterpriseContext` e hooks de orquestração. Redirecionamentos concorrentes entre `MainLayout` e `OnboardingGuard`.
- **Impacto**: O sistema trava com tela branca ou entra em loop infinito de carregamento.

### 2. Sincronização de Dados em Tempo Real
- **Causa**: Filtros de Realtime no `useSupplyChain` usando chaves de canal potencialmente instáveis e falta de tratamento para tabelas de log inexistentes (`supply_chain_ledger`).
- **Impacto**: Movimentações não aparecem instantaneamente para o usuário ou geram erros silenciosos no console.

### 3. Blindagem de Contexto e Auth
- **Causa**: Inicialização assíncrona do Supabase Session pode ocorrer após a montagem do componente, disparando múltiplas atualizações de estado.
- **Impacto**: Inconsistência nos dados da empresa ativa durante o primeiro segundo de uso.

## Plano de Ações

### Fase 1: Blindagem de Infraestrutura React
- **EnterpriseContext**: Refatorar `loadActiveTenant` para usar travas de atomicidade mais rigorosas e garantir que a sincronização com o perfil do usuário ocorra exatamente uma vez por sessão.
- **RenderDepthMonitor**: Ajustar o monitor para ser menos intrusivo e fornecer logs mais limpos, focando apenas em erros críticos.
- **AppRoutes**: Memoização agressiva da árvore de rotas para evitar re-criação de componentes durante atualizações de contexto.

### Fase 2: Estabilização de Supply Chain & Orquestração
- **useSupplyChain**: Corrigir a lógica de subscrição Realtime para garantir que o canal seja removido corretamente e que o `debounce` evite múltiplas chamadas ao banco em inserções em massa.
- **UnifiedSupplyChain**: Adicionar tratamento de erro visual e estados de loading mais granulares para evitar "jumpy UI".

### Fase 3: Auditoria de Segurança e RLS
- Verificar se todas as tabelas críticas (`supply_chain_movements`, `commercial_alerts`) possuem políticas de RLS vinculadas corretamente ao `company_id`.

## Detalhes Técnicos

```text
Ordem de Execução:
1. EnterpriseContext.tsx (Core Stability)
2. useSupplyChain.ts (Logistics Sync)
3. MainLayout.tsx / OnboardingGuard.tsx (Navigation Shield)
4. UnifiedSupplyChain.tsx (UI Polish)
```

**Sem Regressões**: As alterações preservam toda a lógica de negócio atual, focando apenas na mecânica de fluxo de dados e renderização.
