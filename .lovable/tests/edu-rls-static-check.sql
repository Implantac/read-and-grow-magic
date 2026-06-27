-- =====================================================================
-- Verificação estática de RLS multi-tenant — módulo Educação
-- =====================================================================
-- Confere, sem precisar de superuser, que cada tabela edu_* tem:
--   • RLS habilitado
--   • Pelo menos uma policy que filtra por company_id = get_user_company_id(auth.uid())
--   • WITH CHECK também escopado em INSERT/UPDATE/ALL
--   • Coluna company_id NOT NULL
--
-- Uso:  psql -f .lovable/tests/edu-rls-static-check.sql
-- =====================================================================

WITH tables AS (
  SELECT unnest(ARRAY[
    'edu_schools','edu_classes','edu_students','edu_enrollments'
  ]) AS tbl
),
checks AS (
  SELECT
    t.tbl,
    -- 1. RLS habilitado
    (SELECT c.relrowsecurity
       FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname=t.tbl) AS rls_enabled,
    -- 2. company_id NOT NULL
    (SELECT attnotnull FROM pg_attribute
      WHERE attrelid = ('public.'||t.tbl)::regclass
        AND attname = 'company_id' AND NOT attisdropped) AS company_id_not_null,
    -- 3. Tem policy que usa get_user_company_id em USING
    (SELECT bool_or(qual ILIKE '%get_user_company_id%')
       FROM pg_policies
      WHERE schemaname='public' AND tablename=t.tbl) AS using_scoped,
    -- 4. Tem WITH CHECK escopado (qualquer policy com with_check tenant)
    (SELECT bool_or(with_check ILIKE '%get_user_company_id%')
       FROM pg_policies
      WHERE schemaname='public' AND tablename=t.tbl
        AND with_check IS NOT NULL) AS with_check_scoped,
    -- 5. Nenhuma policy permissiva sem filtro de tenant
    (SELECT bool_and(
        qual ILIKE '%get_user_company_id%' OR qual ILIKE '%service_role%'
        OR qual ILIKE '%has_role%')
       FROM pg_policies
      WHERE schemaname='public' AND tablename=t.tbl) AS no_open_policy
  FROM tables t
)
SELECT
  tbl AS table_name,
  CASE WHEN rls_enabled            THEN 'PASS' ELSE 'FAIL' END AS rls,
  CASE WHEN company_id_not_null    THEN 'PASS' ELSE 'FAIL' END AS not_null,
  CASE WHEN using_scoped           THEN 'PASS' ELSE 'FAIL' END AS using_tenant,
  CASE WHEN with_check_scoped      THEN 'PASS' ELSE 'FAIL' END AS check_tenant,
  CASE WHEN COALESCE(no_open_policy,true) THEN 'PASS' ELSE 'FAIL' END AS no_open
FROM checks
ORDER BY tbl;

-- Lista as policies para inspeção visual
SELECT tablename, policyname, cmd,
       left(coalesce(qual,'-'),80)       AS using_,
       left(coalesce(with_check,'-'),80) AS with_check_
FROM pg_policies
WHERE schemaname='public' AND tablename LIKE 'edu\_%'
ORDER BY tablename, cmd, policyname;
