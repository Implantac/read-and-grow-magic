# Auditoria de Refatoração — Snapshot

> Gerado automaticamente como parte do plano de refatoração em fases.
> **Nenhuma mudança de comportamento.** Este documento apenas mapeia o terreno.

## Resumo executivo

A base está em **bom estado estrutural**. Boa parte das "duplicações suspeitas" já é apenas re-export para compatibilidade. Os ganhos reais agora estão em **quebrar componentes grandes (Fase 4)**, não em mover utilitários.

---

## Fase 0 — Achados da auditoria

### Duplicações reais → status
| Suspeita | Realidade | Ação |
|---|---|---|
| `src/lib/formatters.ts` vs `src/shared/utils/formatters.ts` | Já consolidado: `shared/utils/formatters` é apenas re-export tipado de `lib/formatters` (15 linhas). | **Nenhuma** — manter como está. |
| `src/hooks/use-toast.ts` vs `src/ui/base/use-toast.ts` | Já consolidado: `ui/base/use-toast` é 3 linhas re-exportando `@/hooks/use-toast`. | **Nenhuma** — manter como está. |
| `src/lib/toastHelpers.ts` | Já é a única superfície (`toastError`, `toastSuccess`, `mutationErrorHandler`). | **Nenhuma**. |
| `services/inventory/inventoryService.ts` vs `services/wms/inventoryService.ts` | **Não são duplicatas.** O primeiro opera em `products/categories/inventory_movements`; o segundo em `wms_inventory_*`. Domínios distintos. | **Nenhuma** — nomes diferenciados pelo prefixo de diretório bastam. |
| `services/commercial/clientService.ts` (10 linhas, classe vazia herdando `BaseService<'clients'>`) vs `clientsService.ts` (34 linhas, wrapper com `getAll/create/update/delete`) | Cada um tem **um único consumidor**: `ServiceLocator` usa `clientService`; `hooks/commercial/useClients` usa `clientsService`. APIs incompatíveis (classe vs objeto). | **Adiar p/ Fase 2.** Unificar requer adaptar `ServiceLocator` ou `useClients`. Risco > benefício no momento. |

### Arquivos grandes (> 400 linhas, excluindo auto-gerados)
Candidatos prioritários a split na **Fase 4**:

| Linhas | Arquivo |
|---:|---|
| 1102 | `src/modules/production/ProductionKanban.tsx` |
| 1007 | `src/components/fiscal/CreateNFeDialog.tsx` |
| 984  | `src/lib/pcpServices.ts` |
| 844  | `src/modules/commercial/Orders.tsx` |
| 671  | `src/modules/commercial/SellerDashboard.tsx` |
| 637  | `src/ui/base/sidebar.tsx` *(shadcn — não tocar)* |
| 606  | `src/hooks/commercial/useSalesIntelligence.ts` |
| 589  | `src/modules/production/BIIndustrial.tsx` |
| 585  | `src/modules/fiscal/FiscalDashboard.tsx` |
| 553  | `src/modules/commercial/AICommercialDashboard.tsx` |
| 546  | `src/modules/production/OperatorTerminal.tsx` |
| 532  | `src/modules/financial/AccountsReceivable.tsx` |
| 529  | `src/pages/rfid/Integration.tsx` |
| 528  | `src/pages/inventory/StockLevels.tsx` |
| 514  | `src/modules/fiscal/CTe.tsx` |
| 500  | `src/modules/production/PCPPanel.tsx` |

### Observações estruturais positivas
- Camadas `services → hooks → modules/pages` bem demarcadas em quase todos os domínios.
- React Query usado consistentemente com `staleTime` de 5 min.
- Tipos por domínio em `src/types/<dominio>.ts` (sem grandes duplicações).
- Toasts e formatadores já centralizados.
- Memórias do projeto (PT-BR, dark mode tokens, RLS multi-tenant, no-mocks) respeitadas no código auditado.

### Pontos a observar (sem ação agora)
- `src/services/commercial/clientService.ts` e `clientsService.ts` convivem (ver tabela acima).
- Vários módulos > 500 linhas misturam UI + data-fetching + sub-componentes inline.
- `src/lib/pcpServices.ts` (984 linhas) seria melhor sob `src/services/production/` quebrado por subdomínio.

---

## Fase 1 — Consolidação de utilitários

**Status: já realizada em refatorações anteriores.**
Re-exports validados; nada a fazer nesta rodada sem introduzir churn desnecessário.

---

## Próximas fases sugeridas

1. **Fase 4 (alto impacto)** — quebrar `ProductionKanban`, `CreateNFeDialog`, `Orders` em subcomponentes coesos, preservando props públicas.
2. **Fase 2** — unificar `clientService`/`clientsService` adaptando `ServiceLocator` para usar `clientsService`, depois remover `clientService.ts`.
3. **Fase 6** — passada de lint/ordenação de imports automatizada.

Confirme qual fase atacar em seguida e eu prossigo.
