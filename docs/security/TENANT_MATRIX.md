# Matriz de Isolamento Multi-Tenant
Data: 2026-08-06

Este documento classifica o escopo de visibilidade de cada tabela para garantir o isolamento correto.

## Tabelas Core & Fiscais
| Tabela | Escopo | Chave de Isolamento | RLS Ativo | Status |
| :--- | :--- | :--- | :--- | :--- |
| profiles | USER | id | Sim | ✅ |
| companies | COMPANY | id | Sim | ✅ |
| branches | BRANCH | company_id | Sim | ✅ |
| products | COMPANY | company_id | Sim | ✅ |
| stock_movements | BRANCH | branch_id | Sim | ✅ |
| financial_titles | COMPANY | company_id | Sim | ✅ |
| nps_campaigns | COMPANY | company_id | Sim | ✅ |
| nfe | COMPANY | company_id | Sim | ✅ Hardened |
| nfce | COMPANY | company_id | Sim | ✅ Hardened |
| fiscal_reports | COMPANY | company_id | Sim | ✅ Hardened |
| tax_rules | COMPANY | company_id | Sim | ✅ Hardened |

## Auditoria de Políticas (Amostra)
---
Auditing profiles...
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
---
Auditing nfe...
CREATE POLICY "NFe isolated by company" ON public.nfe FOR ALL TO authenticated USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
---
Auditing nfce...
CREATE POLICY "NFCe isolated by company" ON public.nfce FOR ALL TO authenticated USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
---
