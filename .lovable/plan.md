
# WMS Evolution Sprint 1 — Inteligência, Slotting, Digital Twin e KPIs

Modo: **Evolution**. Nada será recriado ou removido. Todas as entregas se conectam ao que já existe (`wms_storage_locations`, `picking_tasks`, `putaway_tasks`, `wms_ai_insights`, `wms_movements`, `wms_shipments`, `stock_balances`, `products`).

## Objetivos de negócio

| Entrega | Custo que reduz | Decisão que automatiza | Erro que evita |
|---|---|---|---|
| Warehouse Intelligence v1 | Km percorridos, retrabalho | Realocação, balanceamento de zonas | Congestionamento invisível |
| Slotting Engine | Tempo de picking | Endereço ideal por SKU | Item pesado em altura, FEFO violado |
| Digital Twin 2D | Tempo de diagnóstico | Visualização de gargalos | Decisão sem contexto espacial |
| KPIs materializados | Reuniões longas, planilhas | Alerta automático fora da meta | OTIF/Accuracy invisíveis |

## Entregas

### 1. KPIs WMS materializados (base para tudo)

Views e função agregadora (somente leitura, sem mexer em fluxos):

- `v_wms_kpi_dock_to_stock` — tempo médio entre `wms_receiving_orders.received_at` e `putaway_tasks.completed_at`.
- `v_wms_kpi_picking_accuracy` — `picking_tasks` confirmadas sem divergência / total.
- `v_wms_kpi_inventory_accuracy` — `wms_inventory_counts` com `variance = 0` / total.
- `v_wms_kpi_otif` — `wms_shipments` entregues no prazo e completos / total.
- `v_wms_kpi_occupancy` — `wms_storage_locations` ocupadas / capacidade total, por zona.
- `v_wms_kpi_productivity_operator` — tarefas/hora por `assigned_to`.

Função `get_wms_kpis(_company_id, _period)` SECURITY DEFINER, `EXECUTE` apenas para `authenticated`.

Componente novo: `src/modules/wms/components/WMSKpiStrip.tsx` (consumido por `WMSDashboard.tsx` sem substituir nada).

### 2. Warehouse Intelligence v1 (engine de recomendações)

Nova tabela `wms_recommendations` (complementa `wms_ai_insights`, que segue para insights de IA gerativa):

```
id, company_id, type, severity, title, body, evidence_jsonb,
suggested_action, target_entity, target_id, status (open|applied|dismissed),
created_at, applied_at, applied_by, expires_at
```

Edge Function `wms-intelligence` (cron a cada 30 min) com 6 regras determinísticas v1:
1. **Congestion** — endereço com > N movimentos/h.
2. **Hot Zone** — rua com ocupação > 90%.
3. **Cold SKU em zona nobre** — item classe C em zona A (slotting waste).
4. **FEFO em risco** — lote próximo do vencimento ainda não priorizado em onda.
5. **Operador ineficiente** — distância média acima do baseline da zona.
6. **Rebalanceamento de doca** — fila desbalanceada em `loading_docks`.

UI: `src/modules/wms/intelligence/RecommendationsPanel.tsx` (lista, aplicar/descartar, com `aria-live`).

### 3. Slotting Engine

Nova tabela `slotting_profiles` (regras por empresa) + `slotting_suggestions` (resultados).

Função `compute_slotting(_company_id)` retorna SKU × endereço sugerido com score baseado em:

- Curva ABC do SKU (giro últimos 90 dias via `wms_movements`).
- Peso/cubagem do produto vs. capacidade/altura do endereço.
- Compatibilidade (temperatura, periculosidade, família).
- Distância da doca de saída predominante.
- Restrições FIFO/FEFO/LIFO já marcadas no lote.

Edge Function `wms-slotting-recompute` (cron diário 03:00 UTC).

UI: `src/modules/wms/slotting/SlottingPlanner.tsx` — tabela de sugestões, simulação de impacto (km economizados), botão "Gerar tarefas de transferência" que cria `wms_movements` do tipo `relocation` reutilizando o fluxo existente.

### 4. Digital Twin 2D

Componente SVG novo `src/modules/wms/twin/WarehouseMap.tsx`:

- Lê `wms_storage_locations` (x/y/zona já disponíveis) e renderiza ruas/posições.
- Camadas alternáveis: ocupação (heatmap), congestionamento (últimas 1h), operadores ativos (via `picking_tasks.assigned_to` + última posição da tarefa), recomendações abertas (pins).
- Hover mostra detalhes do endereço; clique abre drawer com SKU, lote, validade, último movimento.
- Sem libs novas — SVG puro + Tailwind, performance para 10k posições via `<use>` e virtualização por viewport.

Página: `src/modules/wms/twin/DigitalTwin.tsx`, rota `/wms/twin`, link no menu WMS existente.

### 5. Event stream unificado

Tabela `wms_events` (append-only, particionada por mês via trigger):

```
id, company_id, event_type, source_module, entity_type, entity_id,
actor_user_id, payload_jsonb, created_at
```

Triggers nos fluxos críticos já existentes (sem mudar lógica): `wms_receiving_orders`, `putaway_tasks`, `picking_tasks`, `wms_packing_orders`, `wms_shipments`, `wms_movements`, `wms_inventory_counts`.

Consumido pelas KPIs, pela engine de Intelligence e fica pronto para BI/integrações futuras.

## Banco — checklist obrigatório

- Todas as tabelas novas: `company_id NOT NULL`, RLS habilitado, GRANT para `authenticated` + `service_role`, policies via `has_role`/`current_company_id`.
- Índices: `(company_id, created_at)`, `(company_id, status)`, `(company_id, entity_type, entity_id)`.
- `wms_events` particionada mensalmente.
- Funções SECURITY DEFINER com `search_path = public` e `REVOKE EXECUTE ... FROM anon`.

## APIs

- Reaproveita Edge Functions existentes onde possível.
- Novas funções desacopladas: `wms-intelligence`, `wms-slotting-recompute`, `wms-kpi-snapshot` (opcional para cache).
- Sem chamadas por path fixo; sempre `supabase.functions.invoke()`.

## UX (operador)

- `RecommendationsPanel` e `WMSKpiStrip`: alto contraste, badges de severidade, ação em 1 clique.
- `DigitalTwin`: zoom, atalhos `1/2/3/4` para camadas, `Esc` fecha drawer.
- Mobile-first preservado nos terminais já existentes — entregas novas são desktop-first (planejamento/supervisão).

## Performance

- KPIs em views materializadas refresh incremental quando o volume crescer (Sprint 2).
- `wms_events` particionada e indexada para ingestão massiva.
- Slotting calculado em batch (cron), nunca on-request.

## Rollback

- Cada migração em arquivo separado e reversível (DROP TABLE / DROP FUNCTION).
- Feature flag `wms.intelligence_v1`, `wms.slotting_v1`, `wms.digital_twin_v1` em `feature_flags` para desligar UI sem migração reversa.
- Nenhum fluxo legado é alterado — apenas leituras e novas tabelas.

## Definition of Done

- [ ] Migrações aplicadas com GRANTs e RLS.
- [ ] Edge Functions com `verify_jwt` correto, validação Zod, CORS.
- [ ] Triggers de eventos cobrindo os 7 fluxos.
- [ ] Componentes com ARIA, loading states, empty states em PT-BR.
- [ ] Testes Vitest dos serviços de KPI e Slotting.
- [ ] Documentação em `.lovable/wms-evolution-sprint-1.md`.
- [ ] Feature flags criadas e ligadas.
- [ ] Sem regressão em telas existentes (smoke manual nas 20 telas WMS).

## Sequência de implementação

```text
1. Migration base (wms_events + triggers + grants)
2. Migration KPIs (views + função + grants)
3. WMSKpiStrip plugado no WMSDashboard
4. Migration wms_recommendations + Edge wms-intelligence + cron
5. RecommendationsPanel
6. Migration slotting_profiles/suggestions + Edge wms-slotting-recompute
7. SlottingPlanner + integração com wms_movements
8. WarehouseMap (Digital Twin) + página + rota
9. Feature flags + documentação + smoke
```

## Fora do escopo desta Sprint

- Digital Twin 3D (Three.js).
- ML de previsão de ruptura (Sprint 2 — usa `wms_events` como base).
- Voice picking, pick-to-light, integração coletor Honeywell/Zebra.
- Slotting genético/multi-objetivo (v2).
