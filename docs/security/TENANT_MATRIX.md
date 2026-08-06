# Matriz de Isolamento Multi-Tenant
Data: 2026-08-06

Este documento classifica o escopo de visibilidade de cada tabela para garantir o isolamento correto.

## Tabelas Core
| Tabela | Escopo | Chave de Isolamento | RLS Ativo | Status |
| :--- | :--- | :--- | :--- | :--- |
| profiles | USER | id | Sim | ✅ |
| companies | COMPANY | id | Sim | ✅ |
| branches | BRANCH | company_id | Sim | ✅ |
| products | COMPANY | company_id | Sim | ✅ |
| stock_movements | BRANCH | branch_id | Sim | ✅ |
| financial_titles | COMPANY | company_id | Sim | ✅ |
| nps_campaigns | COMPANY | company_id | Sim | ✅ |

## Auditoria de Políticas (Amostra)
---
Auditing profiles...
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
---
Auditing companies...
CREATE POLICY "Users can view companies they belong to" ON public.companies FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND company_id = companies.id));
---
Auditing branches...
CREATE POLICY "Branches are isolated by company" ON public.branches FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
---
