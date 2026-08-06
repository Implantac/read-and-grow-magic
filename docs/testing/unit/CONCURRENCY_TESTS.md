# Testes de Concorrência e Atomicidade
Data: 2026-08-06

## Auditoria de Race Conditions
- **Estoque**: Tabelas `stock_balances` e `stock_movements`.
- **Financeiro**: Balanços de contas bancárias.
- **WMS**: Atribuição de tarefas de picking.

## Plano de Implementação de Testes
1. Criar script de stress para `update_stock_balance`.
2. Validar bloqueios pessimistas (SELECT FOR UPDATE) onde necessário.
3. Garantir que triggers de estoque não permitem saldo negativo em transações concorrentes.
