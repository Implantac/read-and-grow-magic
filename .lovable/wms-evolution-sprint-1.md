# WMS Evolution Sprint 1 — Entregas

Modo: **Evolution** (nada removido ou recriado). Tudo plugado em estruturas existentes.

## Backend

### Tabelas novas
- `wms_events` — stream append-only de eventos WMS (`event_type`, `source_module`, `entity_type`, `entity_id`, `payload`).
- `wms_recommendations` — recomendações da engine de inteligência (`type`, `severity`, `evidence`, `suggested_action`, `status`).
- `slotting_profiles` — regras de slotting por empresa.
- `slotting_suggestions` — sugestões geradas (SKU → endereço, score, distância economizada).

Todas com `company_id NOT NULL`, RLS habilitado, GRANT para `authenticated` + `service_role`, policies via `has_role` / `get_user_company_id`.

### Views de KPI (security_invoker = on)
- `v_wms_kpi_dock_to_stock`
- `v_wms_kpi_picking_accuracy`
- `v_wms_kpi_inventory_accuracy`
- `v_wms_kpi_otif`
- `v_wms_kpi_occupancy`
- `v_wms_kpi_productivity_operator`

### RPC
- `get_wms_kpis(_days int)` — agrega métricas para o período (default 7d), SECURITY DEFINER, `EXECUTE` apenas para `authenticated`.

### Edge Functions
- `wms-intelligence` — 5 regras determinísticas (hot zone, congestion, cold SKU em zona nobre, FEFO em risco, dock imbalance). Pode rodar via cron (30 min) ou invoke manual com `{ company_id }`.
- `wms-slotting-recompute` — recálculo diário de slotting (ABC × distância × capacidade). Cron sugerido 03:00 UTC.

## Frontend

| Componente | Caminho | Função |
|---|---|---|
| `WMSKpiStrip` | `src/modules/wms/components/WMSKpiStrip.tsx` | Faixa com 6 KPIs (Dock-to-Stock, Accuracy, OTIF, Ocupação, Recomendações). |
| `RecommendationsPanel` | `src/modules/wms/intelligence/RecommendationsPanel.tsx` | Lista de recomendações com aplicar/descartar. |
| `Intelligence` | `src/modules/wms/intelligence/Intelligence.tsx` | Página `/wms/inteligencia`. |
| `WarehouseMap` | `src/modules/wms/twin/WarehouseMap.tsx` | Renderização SVG do armazém com heatmap. |
| `DigitalTwin` | `src/modules/wms/twin/DigitalTwin.tsx` | Página `/wms/twin`. |
| `SlottingPlanner` | `src/modules/wms/slotting/SlottingPlanner.tsx` | Página `/wms/slotting` com simulação de impacto. |

`WMSKpiStrip` foi plugado em `src/modules/wms/WMSDashboard.tsx` sem alterar nada do que já existia.

## Rotas adicionadas
- `/wms/twin` → DigitalTwin
- `/wms/inteligencia` → Intelligence
- `/wms/slotting` → SlottingPlanner

## Como acionar manualmente

```ts
await supabase.functions.invoke("wms-intelligence", { body: { company_id } });
await supabase.functions.invoke("wms-slotting-recompute", { body: { company_id } });
```

## Smoke test

1. Abrir `/wms` — confirmar KPI strip carregando sem erro.
2. Invocar `wms-intelligence` — confirmar inserções em `wms_recommendations`.
3. Abrir `/wms/inteligencia` — listar e aplicar/descartar recomendação.
4. Invocar `wms-slotting-recompute` — confirmar `slotting_suggestions` pendentes.
5. Abrir `/wms/slotting` — visualizar tabela e simulação.
6. Abrir `/wms/twin` — confirmar render do mapa SVG.

## Próxima Sprint (preview)
- Triggers em fluxos críticos para popular `wms_events` automaticamente (Receiving, Putaway, Picking, Packing, Shipment, Movements, Counts).
- Materialized views + refresh incremental quando volume crescer.
- Slotting v2: multi-objetivo (peso, temperatura, família, periculosidade) + simulação what-if.
- Digital Twin: heatmap de congestionamento (1h) + pins de recomendações + camadas alternáveis com atalhos 1/2/3/4.
- ML de previsão de ruptura usando `wms_events` como série temporal.
