# 📋 Auditoria Técnica USE SISTEMAS — Parte 2
**Data:** 2026-07-03 | **Escopo:** `src/`, `supabase/functions/`

## 1. Código Morto
| # | Sev | Local | Descrição | Ação |
|---|-----|-------|-----------|------|
| 1.1 | Alto | `src/components/commercial/SalesSummary.tsx` | Zero referências | Remover |
| 1.2 | Alto | `src/services/commercial/salesService.ts` | Aponta para tabela `sales` inexistente (real é `orders`); sem consumers | Remover |
| 1.3 | Médio | `src/pages/Index.tsx` | Scaffold "Welcome to Your Blank App", não roteado | Remover |
| 1.4 | Médio | `src/hooks/accounting/useDREDynamic.ts` | Duplica `useDRE` | Consolidar |
| 1.5 | Baixo | `src/components/executive/diretoria/*` | Duplica `executive/*` | Remover pasta `diretoria/` |

## 2. Duplicações
| # | Sev | Local | Ação |
|---|-----|-------|------|
| 2.1 | Crítico | `clientService.ts` + `clientsService.ts` | Eliminar `clientService.ts` |
| 2.2 | Alto | `inventory/inventoryService.ts` + `wms/inventoryService.ts` | Renomear WMS para `wmsInventoryService.ts` |
| 2.3 | Alto | `useDRE` / `useDREDynamic` / `useDREManagerial` | Unificar com `type` |
| 2.4 | Médio | `executive/AIConsensusPanel` vs `diretoria/AIConsensusPanel` | Manter só executive |
| 2.5 | Médio | `production/DigitalTwin` + `wms/twin/DigitalTwin` | Renomear com namespace |

## 3. Imports Fantasma / Cast `as any`
- **Crítico** `wmsService.ts:9,20,31` — `.from('stock_balances' as any)` etc.
- **Crítico** `productionService.ts:9,19,28,38` — `production_orders`, `production_resources`, `quality_inspections` sem tipos.
- **Crítico** `rfidService.ts:5,26,47` — RFID sem tipos.
- **Alto** `supabase/functions/deleted-orders-test.ts:5` — URL Supabase hardcoded.
- **Médio** `useConstructionProjects/Details.ts` — `(supabase as any).from(...)`.

## 4. Rotas Órfãs
- **Alto** `src/pages/inventory/*` (Categories, Kardex, Products, StockLevels, Movements) — sem `InventoryRoutes.tsx`.
- **Alto** `src/pages/purchasing/*` (PurchaseOrders, Suppliers, Quotations) — sem `PurchasingRoutes.tsx`.
- **Alto** `src/pages/credit/*` (Collections, CreditAnalysis, OrderBlocks, RiskDashboard) — sem `CreditRoutes.tsx`.
- **Médio** `DashboardView`, `PluginEditor` — registrados fora do padrão.
- **Médio** `production/IndustrialDashboard`, `BIIndustrial` — não roteados.

## 5. Fluxos Incompletos
- **Alto** `salesService.ts` — tabela inexistente.
- **Alto** `clientService.ts` — classe vazia.
- **Médio** `AlertsTable.tsx` — array `nAlerts = []` hardcoded.
- **Médio** `Upgrade.tsx` / `Subscribe.tsx` — sem gateway.
- **Médio** `functions/deleted-orders-test.ts` — teste solto.

## 6. Arquitetura
- **Crítico** 144 arquivos em `pages/` + `modules/` chamam `supabase` diretamente (bypass de service layer).
- **Alto** `components/sre/PostmortemActions.tsx` — queries in-component.
- **Alto** `components/auth/RoleGuard.tsx` — `supabase.auth.getUser()` direto.
- **Alto** `core/infrastructure/BaseRepository.ts` sobrepõe `services/shared/baseService.ts`.
- **Médio** `clientsService.getAll(): any[]`.

## 7. Segurança
- **Crítico** URL do projeto hardcoded em `deleted-orders-test.ts`.
- **Crítico** Tabelas críticas via `as any` — RLS não verificável estaticamente.
- **Alto** `pix-webhook` usa `SERVICE_ROLE_KEY` sem HMAC obrigatório.
- **Alto** `WidgetRenderer` chama edge function sem validar payload.
- **Médio** `_shared/validate.ts` + `_shared/validation.ts` — duplicados.

## 8. Performance
- **Alto** `SELECT *` sem `limit` em inventory/clients/sales services.
- **Alto** `production/` (42 arquivos) e `wms/` sem `VirtualList`.
- **Médio** 347 `.map()` sem memoização em WMS+Produção.
- **Médio** JOIN `sale_items(*)` sem paginação.
- **Baixo** `QueryClient` refetchOnWindowFocus global causa cascata.

## 9. UX/UI
- **Alto** `modules/production/*` sem `isLoading`/`Skeleton`.
- **Alto** Credit inacessível (rotas ausentes).
- **Médio** `ClientFormDialog` sem Zod/RHF.
- **Médio** `AlertsTable` sempre mostra 0.
- **Baixo** Upgrade/Subscribe sem pagamento.

## 10. Tipagem
- **Crítico** `clientsService` métodos `any`.
- **Crítico** `usersService` — `callAdminUsers(action, params?: any)`.
- **Alto** `useCustomEntities` — `default_value/options/validation: any`.
- **Alto** `wmsService` + `productionService` cast `as any`.
- **Médio** `useWMSShipments` — `r: any`, `updates: any`.
- **Médio** `App.tsx:101` — `error: any`.

## Resumo
🔴 Críticos: 8 · 🟠 Altos: 18 · 🟡 Médios: 16 · 🟢 Baixos: 5

## 🏆 Top 10 ROI
1. **Registrar rotas Crédito/Estoque/Compras** — módulos inacessíveis.
2. **Remover URL hardcoded** em `deleted-orders-test.ts`.
3. **Tipar tabelas via `as any`** (WMS/Produção/RFID).
4. **Eliminar `clientService.ts`**.
5. **Migrar 144 arquivos para service layer**.
6. **Paginação em queries `SELECT *`**.
7. **Deletar `salesService.ts`** (tabela inexistente).
8. **Skeletons em Produção/WMS**.
9. **Tipar clientsService/usersService/useCustomEntities**.
10. **Consolidar hooks DRE**.
