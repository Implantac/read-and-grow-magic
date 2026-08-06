# Matriz de Isolamento Multi-Tenant
Data: 2026-08-06

Este documento classifica o escopo de visibilidade de cada tabela para garantir o isolamento correto.

| Tabela | Escopo | Chave de Isolamento | RLS Ativo |
| :--- | :--- | :--- | :--- |
| users | USER | id | Sim |
| companies | COMPANY | id | Sim |
| branches | BRANCH | company_id | Sim |
| products | COMPANY | company_id | Sim |
| stock_movements | BRANCH | branch_id | Sim |
| financial_titles | COMPANY | company_id | Sim |
| nps_campaigns | COMPANY | company_id | Sim |

*Nota: Auditoria completa de todas as tabelas em andamento em `docs/security/tables_list.txt`.*
