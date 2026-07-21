
# AUD-3 — Refactor de Tipagem por Domínio

## Objetivo
Eliminar os ~44 hooks com `as any` remanescentes, tratando cada padrão de cast pela sua causa raiz em vez de remoções em massa.

## Padrões identificados e estratégia

**1. `Partial<Row>` em inserts (maioria dos casos)**
Causa: tipos gerados exigem campos obrigatórios (`RejectExcessProperties`), mas hooks aceitam `Partial<T>` do domínio.
Fix: trocar assinatura do argumento de `Partial<Row>` para o tipo `TablesInsert<'table'>` do Supabase, ou tipo explícito com os campos obrigatórios marcados como `required`.

**2. `(supabase as any).rpc('nome', ...)`**
Causa: função RPC não existe nos tipos gerados.
Fix: verificar se a RPC existe no banco; se sim, forçar regeneração de tipos. Se for RPC dinâmica, isolar o cast em wrapper tipado (`callRpc<T>(name, args)`).

**3. `(data as any).campo` em respostas**
Causa: joins ou views retornando campos não tipados.
Fix: definir `interface` de resposta local e usar `.returns<T>()` do Supabase-js, ou mapear no adaptador.

**4. `{ ...obj } as any` em objetos inline**
Causa: campos dinâmicos ou colunas recém-adicionadas fora de sync com `types.ts`.
Fix: consultar schema real e adicionar campos faltantes ao objeto; se coluna faltar em `types.ts`, apenas anotar para regeneração.

## Execução em ondas

- **Onda 1 — Comercial** (~10 arquivos): `useClientTimeline`, `useFollowUpTasks`, `useSalesFunnel`, `useSalesReps`, `useOrders`, `useOrderFlow`, `useOrderLifecycle`, `useCommercialAlerts`, `useClientProfiles`, `useQuotations`.
- **Onda 2 — Financeiro** (~10 arquivos): `useFinancialRecurring`, `useFinancialBoletos`, `useFinancialChecks`, `useFinancialSettlements`, `useFinancialAdvances`, `useFinancialSecurity`, `useFinancialAudit`, `useBankReconcileEngine`, `useBankStatementImport`, `usePixCharges`.
- **Onda 3 — Fiscal** (~8 arquivos): `useTaxRules`, `useTaxAdvancedRules`, `useSpedFiles`, `useReinf`, `useNfeCertificate`, `useCTe`, `useMDFe`, `useNFCe`.
- **Onda 4 — Produção/WMS/Inventário** (~8 arquivos): `useIndustrialAlerts`, `useOutsourcingOrders`, `useProducts`, `useSupplyStock`, `useWMSConference`, `useInventoryQuery`, `useBillingStockReconcile`, `useReturnItems`.
- **Onda 5 — Sistema/Vertical** (~8 arquivos): `useAgro`, `useHealth`, `useConstructionProjects`, `useCompanies`, `useUsage`, `useAutomationEngine`, `useDashboardEngine`, `useWorkflowEngine`, `useStorefrontNotifications`, `useAIBrain`.

## Regras de qualidade
- Cada onda: refactor → `bun run build` limpo → commit lógico → próxima.
- Se um cast for legítimo (RPC dinâmica, JSON heterogêneo), substituir por tipo local explícito com comentário `// intentional: <razão>`, nunca deixar `as any` sem justificativa.
- Nenhuma mudança de comportamento — apenas tipos e assinaturas.

## Entrega
Ao final: 0 ocorrências de `as any` em `src/hooks/` (exceto casts explicitamente justificados), build + tsgo limpos, e relatório em `.lovable/aud-3-typing-report.md`.

## Escopo desta rodada
Iniciar **Onda 1 (Comercial)** e reportar antes de seguir para as próximas.
