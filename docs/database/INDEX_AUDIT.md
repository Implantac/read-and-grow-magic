# Auditoria de Índices e Banco de Dados — FASE 24

## 1. Cobertura de Índices Críticos
Auditoria realizada em tabelas de alto volume para garantir performance em filtros multi-tenant.

| Tabela | Colunas Indexadas (Auditado) | Status |
| :--- | :--- | :--- |
| `profiles` | `id`, `company_id` | ✅ OK |
| `products` | `id`, `company_id`, `sku`, `status` | ✅ OK |
| `orders` | `id`, `company_id`, `status`, `created_at` | ✅ OK |
| `financial_titles` | `id`, `company_id`, `status`, `due_date` | ✅ OK |
| `stock_movements` | `id`, `company_id`, `product_id`, `created_at` | ✅ OK |
| `nfe_events` | `id`, `company_id`, `nfe_id`, `status` | ✅ OK |

## 2. Padrões de Busca e Relatórios
- **Filtros de Data**: Índices em `created_at` e `due_date` validados para relatórios DRE e Fluxo de Caixa.
- **Foreign Keys**: Todas as chaves estrangeiras que ligam a `companies` e `branches` possuem índices B-Tree para otimizar JOINs.
- **Busca por Texto**: Utilização de chaves parciais em `sku` e `document_number`.

## 3. Recomendações de Manutenção
- Evitar a criação de índices em colunas de baixa cardinalidade (ex: booleans simples) sem filtro parcial.
- Utilizar `EXPLAIN ANALYZE` em queries de dashboards customizados.
