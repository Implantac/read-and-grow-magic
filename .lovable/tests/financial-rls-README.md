# Financial / Payment RLS Role-Matrix Tests

Duas maneiras de validar as policies RLS + checks de papel nas tabelas
`bank_*`, `financial_*` e `payment_records`:

## 1. `financial-rls-role-matrix.sql` (dev local com superuser)

Script único em transação com `ROLLBACK` no final. Requer conexão de superuser
ao Postgres (pode inserir em `auth.users`).

```
psql "$PG_URL" -v ON_ERROR_STOP=1 -f .lovable/tests/financial-rls-role-matrix.sql
```

Imprime uma tabela `(table, role, op, expected, actual, status)` e falha com
exit != 0 se qualquer combinação divergir da matriz esperada.

## 2. Edge function `test-financial-rls` (CI / Lovable Cloud)

Roda a **mesma matriz** em runtime real. Cria 4 usuários ephemerais via Admin
API, atribui roles (`admin/manager/operator/viewer`) na empresa do chamador,
seed de 1 linha por tabela, executa SELECT/INSERT/UPDATE/DELETE por papel
usando um client PostgREST autenticado por usuário (RLS enforced end-to-end),
faz cleanup dos usuários e retorna JSON com sumário.

Requisitos: caller precisa ser `admin`.

```
curl -H "Authorization: Bearer $ADMIN_JWT" \
     https://<project>.functions.supabase.co/test-financial-rls
```

Resposta:

```json
{
  "ok": true,
  "total": 129,
  "passed": 129,
  "failed": 0,
  "failures": [],
  "results": [ { "table": "bank_accounts", "role": "admin", "op": "SELECT",
                 "expected": "allow", "actual": "allow", "pass": true }, ... ]
}
```

## Matriz esperada (fonte da verdade)

| Tabela                  | SELECT (todos) | INSERT               | UPDATE               | DELETE               |
| ----------------------- | -------------- | -------------------- | -------------------- | -------------------- |
| bank_accounts           | ✔              | admin, manager       | admin, manager       | admin                |
| bank_transactions       | ✔              | admin, manager, op   | admin, manager, op   | admin, manager       |
| bank_transfers          | ✔              | admin, manager       | admin, manager       | admin                |
| cash_flow_entries       | ✔              | admin, manager, op   | admin, manager, op   | admin, manager       |
| financial_checks        | ✔              | admin, manager, op   | admin, manager, op   | admin                |
| financial_ledger        | ✔              | admin, manager       | admin, manager       | admin                |
| financial_settlements   | ✔              | admin, manager, op   | admin, manager       | admin                |
| payment_records         | ✔              | admin, manager, op   | admin, manager       | admin                |

Cross-tenant: `viewer` de empresa A não pode enxergar linhas de empresa B.
