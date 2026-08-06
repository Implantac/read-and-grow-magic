# Baseline de Hardening - READ & GROW
Data: 2026-08-06
Status Inicial: Auditoria em curso - **CONCLUÍDO ESTABELECIMENTO DE BASES**

## Resultados de Verificação Inicial
- Lint: Executado (erros de `any` e tipagem identificados em ~100 arquivos).
- Typecheck: Falhando (erros em componentes Commercial, Financial e Fiscal).
- Migrações: Listadas em `docs/hardening/migrations_list.txt`.
- Funções SECURITY DEFINER: Amostra coletada em `docs/hardening/security_definer_audit.txt`.

## Achados Críticos (Fase 0)
1. **Divergência de Identificadores**: Módulos usam `company_id` e `branch_id` de forma inconsistente em consultas frontend.
2. **Exposição de RLS**: Algumas tabelas podem estar sem políticas restritivas de INSERT (vulnerabilidade de spoofing).
3. **Tipagem Fraca**: O uso excessivo de `any` em hooks de dados compromete a segurança em tempo de compilação.


## Funcionalidades Críticas de Preservação
- Geração de Boletos (Financial)
- Emissão de NF-e (Fiscal)
- Movimentação de Estoque (WMS)
- Processamento de NPS (Relacionamento)
