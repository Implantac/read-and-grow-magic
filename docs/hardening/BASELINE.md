# Baseline de Hardening - READ & GROW
Data: 2026-08-06
Status Inicial: Auditoria em curso

## Resultados de Verificação Inicial
- Lint: Executado (verificar logs para erros residuais)
- Typecheck: Executado (verificar logs para erros residuais)
- Migrações: Listadas em `docs/hardening/migrations_list.txt`
- Funções SECURITY DEFINER: Amostra coletada em `docs/hardening/security_definer_audit.txt`

## Pendências Identificadas (Fase 0)
1. Consolidar erros de tipagem remanescentes.
2. Mapear todas as tabelas sem RLS ativo (se houver).
3. Verificar isolamento de `company_id` nos módulos Financeiro e WMS.

## Funcionalidades Críticas de Preservação
- Geração de Boletos (Financial)
- Emissão de NF-e (Fiscal)
- Movimentação de Estoque (WMS)
- Processamento de NPS (Relacionamento)
