# Verificação de RLS multi-tenant — Módulo Educação

Garante que **escolas, turmas, alunos e matrículas** ficam isolados por `company_id`.

## 1. Verificação estática (automatizada)

Confere policies, RLS habilitada e `company_id NOT NULL` direto no `pg_catalog`.

```bash
psql -f .lovable/tests/edu-rls-static-check.sql
```

Esperado: todas as 4 tabelas (`edu_schools`, `edu_classes`, `edu_students`,
`edu_enrollments`) com `rls=PASS`, `not_null=PASS`, `using_tenant=PASS`,
`check_tenant=PASS`, `no_open=PASS`. Status atual: ✅ todas PASS.

A query também lista as policies para inspeção visual — todas devem usar
`company_id = get_user_company_id(auth.uid())` em USING **e** WITH CHECK.

## 2. Verificação manual em runtime (dois tenants)

Como `auth.users` e os triggers fiscais impedem seed direto via `psql`,
o teste cross-tenant em runtime é feito pelo próprio app:

1. **Tenant A**
   - Logue como admin do Tenant A (`admin@empresa.com` / `admin123`).
   - Vá em `/educacao` → crie a escola **"Escola Alpha"**, uma turma e um aluno.
   - Anote o `id` da escola via DevTools → React Query devtools (`edu_schools`).
2. **Tenant B**
   - Faça logout e logue como admin de outra empresa (cadastrada via Onboarding).
   - Acesse `/educacao`. A listagem **NÃO** deve mostrar "Escola Alpha".
   - No console do navegador, rode:
     ```js
     const { data, error } = await window.supabase
       .from('edu_schools').select('*').eq('id', '<id-da-escola-A>').maybeSingle();
     console.log({ data, error });
     ```
     Esperado: `data === null` (RLS bloqueou). `error` deve ser `null`.
3. **Tentativa de escrita cross-tenant**
   - Ainda como Tenant B, no console:
     ```js
     const { error } = await window.supabase
       .from('edu_schools')
       .insert({ company_id: '<companyId-do-tenant-A>', name: 'Invasão' });
     console.log(error);
     ```
     Esperado: erro `42501 new row violates row-level security policy`.

## 3. Resultado da última execução

```
   table_name    | rls  | not_null | using_tenant | check_tenant | no_open
-----------------+------+----------+--------------+--------------+---------
 edu_classes     | PASS | PASS     | PASS         | PASS         | PASS
 edu_enrollments | PASS | PASS     | PASS         | PASS         | PASS
 edu_schools     | PASS | PASS     | PASS         | PASS         | PASS
 edu_students    | PASS | PASS     | PASS         | PASS         | PASS
```

Conclusão: o módulo Educação está **multi-tenant safe** no nível de banco.
Qualquer alteração futura nas policies `edu_*` deve re-executar o script
estático antes do deploy.
