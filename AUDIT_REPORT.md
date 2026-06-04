# Relatório de Auditoria Global - ERP Enterprise

## 1. Código Morto e Redundâncias
- **Componentes Duplicados:** `src/components/ui` vs `src/ui/base` (shadcn duplicado).
- **Serviços Redundantes:** Hooks de busca de dados (`useProducts`, `useOrders`) possuem lógica de serviço misturada; devem ser movidos para `src/modules/<module>/services`.
- **Dashboards:** `ExecutiveDashboard` e `Dashboard.tsx` compartilham muitos KPIs similares. Devem ser unificados sob um componente `KpiGrid` no `shared`.

## 2. Inconsistências de Fluxo
- O fluxo de faturamento fiscal está separado da saída de estoque em alguns módulos.
- O CRM não está totalmente integrado ao Financeiro (comissões).

## 3. Gargalos de Performance
- Ausência de virtualização em tabelas com >500 registros (ex: `StockMovements`).
- Re-renders excessivos no `MainLayout` ao navegar entre módulos.

## 4. Score Atual
- Arquitetura: 6/10
- Escalabilidade: 5/10
- Fiscal: 7/10
- IA: 8/10
- UX: 6/10
