# Relatório de Performance — READ & GROW

## Resumo Executivo
Auditoria de performance realizada para garantir escalabilidade do ERP. Foco em limites de consulta (PERF-GUARD), cache distribuído (React Query) e otimização de renderização.

## 1. PERF-GUARD (Query Limits)
Implementada centralização de limites no `src/lib/queryLimits.ts`:
- `LIST_LIMIT`: 500 (Grids e Kanbans)
- `REPORT_LIMIT`: 5000 (Agregações)
- `LEDGER_LIMIT`: 2000 (Extratos)
- Função `pageRange` padronizada para paginação via Supabase/PostgREST.

## 2. React Query e Cache Strategy
- `staleTime` global configurado para 5 minutos em operações de leitura pesada.
- `useCurrentPlan`: 10 minutos de cache para evitar sobrecarga no RPC de permissões.
- Invalidadores automáticos integrados ao `useRealtimeWMS` para garantir consistência sem refetch excessivo.

## 3. Realtime e Conectividade
- Exponential backoff implementado no `useCurrentPlan`.
- Canais de Realtime limitados ao necessário para evitar consumo de banda e CPU no cliente.

## 4. Próximos Passos (Fase 24)
- Auditoria de índices compostos para queries que utilizam filtros de `company_id` + `status`.
- Virtualização de tabelas com mais de 200 linhas visíveis.
