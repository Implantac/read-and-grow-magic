# Plano de Refatoração Profunda

O projeto tem 200+ arquivos em `src/` e 25+ Edge Functions. Uma refatoração "tudo de uma vez" quebraria fluxos. Proponho executar em **fases pequenas, verificáveis e sem mudança de comportamento**, validando build/tipos entre cada uma.

## Fase 0 — Auditoria (somente leitura)
Mapear, antes de tocar em código:
- Duplicações reais (`services/commercial/clientService.ts` vs `clientsService.ts`, `inventory/inventoryService.ts` vs `wms/inventoryService.ts`, `ui/base/use-toast.ts` vs `hooks/use-toast.ts`, `shared/utils/formatters.ts` vs `lib/formatters.ts`).
- Arquivos > 400 linhas (candidatos a split).
- Imports circulares e barrel files ausentes.
- Hooks com lógica de UI misturada a data-fetching.
- Componentes de página fazendo chamadas Supabase direto (devem passar por service + hook).

Entrego um relatório curto em `AUDIT_REPORT.md` (substituindo o atual) com a lista priorizada.

## Fase 1 — Consolidação de utilitários (baixo risco)
- Unificar `formatters` em `src/lib/formatters.ts`, deixar `shared/utils/formatters.ts` re-exportando para não quebrar imports.
- Unificar `use-toast` em `src/hooks/use-toast.ts`, idem re-export.
- Padronizar `toastHelpers` como única superfície de toast.

## Fase 2 — Camada de serviços
- Resolver o par `clientService`/`clientsService` (manter o mais usado, re-export do outro).
- Garantir que todo módulo siga: `services/<dominio>/<recurso>Service.ts` → `hooks/<dominio>/use<Recurso>.ts` → `pages|modules/...`.
- Mover chamadas `supabase.from(...)` que vivem em páginas para o service correspondente.

## Fase 3 — Hooks
- Padronizar React Query: chaves `['<dominio>', '<recurso>', ...params]`, `staleTime` herdado do default (5min — regra de memória).
- Extrair lógica repetida em `hooks/shared/useCrud.ts` quando aplicável.

## Fase 4 — Componentes grandes
- Quebrar componentes > 400 linhas em subcomponentes coesos no mesmo diretório, mantendo a API pública (props) idêntica.
- Alvos prováveis: `BrainCommandCenter`, `ExecutiveDashboard`, dashboards de Fiscal/Financial.

## Fase 5 — Tipos
- Garantir que `types/<dominio>.ts` seja a fonte única; remover `interface` duplicadas declaradas em componentes.
- Não tocar em `src/integrations/supabase/types.ts` (auto-gerado).

## Fase 6 — Imports & lint
- Ordenar imports (externos → `@/core` → `@/shared` → `@/components` → relativos).
- Rodar `tsgo` e corrigir o que aparecer.

## Garantias
- **Nenhuma mudança de UI, rota, schema, RLS ou edge function.**
- Cada fase é um conjunto pequeno de edits seguido de typecheck automático.
- Re-exports preservam todos os imports atuais — zero breaking changes.

## Detalhes técnicos
- Não mexer em: `src/integrations/supabase/client.ts`, `types.ts`, `.env`, `supabase/config.toml`, migrações.
- Memórias do projeto respeitadas: PT-BR, dark mode tokens, sem mocks, multi-tenant RLS intactos.
- Sem instalar/remover dependências nesta refatoração.

## Pergunta antes de começar
Posso começar pela **Fase 0 + Fase 1** (auditoria + consolidação de utilitários) nesta rodada? São as de menor risco e já entregam ganho visível. Avanço para as demais fases em mensagens seguintes, conforme você aprovar — assim você revisa em blocos pequenos em vez de um diff gigante.