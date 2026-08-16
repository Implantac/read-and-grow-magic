# Plano de Auditoria e Hardening Enterprise — Read & Grow

Este documento detalha as ações estratégicas para consolidar a segurança multitenant, otimizar o banco de dados e padronizar a governança de dados do ecossistema ERP.

## 1. Auditoria de Segurança (RLS & RBAC)
- **Problema**: Políticas de RLS redundantes na tabela `orders` (9 políticas) e `nfe` (9 políticas) geram overhead e riscos de "permissão por omissão". Uso inconsistente de casts de texto vs enum `app_role`.
- **Solução**: 
    - Consolidar políticas em 4 padrões (SELECT, INSERT, UPDATE, DELETE) por tabela.
    - Padronizar o uso de `has_role(auth.uid(), 'role_name'::app_role)`.
    - Garantir que `check_hierarchy_access` seja o gatekeeper único para visualização consolidada (Matriz -> Filiais).

## 2. Hardening de Banco de Dados
- **Traceabilidade**: Verificar se `correlation_id` e `causation_id` estão presentes em todas as tabelas de Ledger (Financeiro e Logístico) e Documentos Fiscais.
- **Integridade**: Criar triggers de validação para impedir `stock_balances` negativo quando a política `inventory.allowNegativeStock` for `false`.
- **Performance**: Criar índices parciais para buscas de `correlation_id` e `branch_id` em tabelas de grande volume.

## 3. Segurança de Contexto (Frontend)
- **Hardening**: Refatorar `EnterpriseContext.tsx` para garantir que o `company_id` da sessão seja validado contra o token JWT antes de qualquer operação sensível.
- **RBAC Sync**: Garantir que as definições de roles no frontend (`AppRole`) estejam estritamente alinhadas com o enum `public.app_role` do backend.

## 4. Próximos Passos (Fase 1 - Hardening)
1. Executar migração de consolidação de RLS (`orders`, `nfe`, `stock_balances`).
2. Implementar trigger de trava de estoque negativo baseada em política.
3. Adicionar `GRANT` explícitos para o papel `service_role` em todas as novas funções de auditoria.

---
*Assinado: Full Enterprise Software House (QA & Security Branch)*
