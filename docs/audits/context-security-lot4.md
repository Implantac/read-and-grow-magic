# Auditoria do Lote 4 — Isolamento por unidade e canal

## Estado

A auditoria foi executada sobre o schema e as políticas reais. A aplicação das correções permanece pendente enquanto o Lovable Cloud conclui alterações e volta ao estado saudável.

## Lacunas comprovadas

1. `settle_account` possui uma correção tenant-scoped já versionada, mas a definição ativa precisa ser reconciliada com essa versão.
2. `process_invoice_atomic` aceita `company_id` do payload sem validar a empresa da sessão.
3. `run_financial_audit` opera globalmente; o acesso deve permanecer apenas no serviço protegido e a execução deve ser limitada à empresa solicitante.
4. `stock_movements` acumula políticas permissivas antigas, permitindo que uma regra mais fraca contorne as regras por perfil.
5. As tabelas transacionais centrais ainda não aplicam isolamento uniforme por `branch_id` e `canal_operacional`.
6. `has_branch_access` valida apenas a empresa da filial, não a filial atribuída ao usuário.
7. `adjust_stock` valida empresa, porém não exige perfil operacional autorizado.

## Ordem de correção

1. Reaplicar a versão protegida de `settle_account` e validar o tenant em `process_invoice_atomic`.
2. Restringir `run_financial_audit` ao serviço protegido e torná-la company-scoped.
3. Consolidar as políticas de `stock_movements` em um único conjunto por operação e perfil.
4. Corrigir `has_branch_access` e aplicar o padrão `empresa + matriz ou filial atribuída` nas tabelas críticas.
5. Exigir perfil `operator`, `manager` ou `admin` em `adjust_stock`.
6. Executar testes negativos com empresa, filial e canal adulterados antes de concluir o lote.

## Evidência atual

- O linter do banco não apresentou alertas automáticos.
- A revisão manual identificou falhas que o linter não cobre, especialmente autorização dentro de funções `SECURITY DEFINER` e composição de políticas permissivas.
- A compilação do aplicativo estava saudável antes desta auditoria.