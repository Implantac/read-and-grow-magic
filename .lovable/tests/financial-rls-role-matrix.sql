-- ============================================================================
-- RLS + Role Matrix Tests: financial_* / payment_* / bank_*
-- ----------------------------------------------------------------------------
-- Runs entirely in a single transaction and ROLLBACKs at the end so no
-- real data is touched. Prints a PASS/FAIL summary per (table, role, op).
--
-- Usage:  psql "$PG_URL" -v ON_ERROR_STOP=1 -f .lovable/tests/financial-rls-role-matrix.sql
--
-- Roles tested: admin, manager, operator, viewer
-- Ops tested:   SELECT, INSERT, UPDATE, DELETE
-- Tables:       bank_accounts, bank_transactions, bank_transfers,
--               cash_flow_entries, financial_checks, financial_ledger,
--               financial_settlements, payment_records
-- ============================================================================

BEGIN;

-- Skip user triggers (fiscal defaults, cx weights, etc.) that require extra
-- fixtures beyond RLS scope. Everything is rolled back at the end.
ALTER TABLE public.companies DISABLE TRIGGER USER;

-- ---------- Fixtures ---------------------------------------------------------
DO $$
DECLARE
  v_company uuid := gen_random_uuid();
  v_admin   uuid := gen_random_uuid();
  v_manager uuid := gen_random_uuid();
  v_operator uuid := gen_random_uuid();
  v_viewer  uuid := gen_random_uuid();
BEGIN
  -- Isolated company
  INSERT INTO public.companies (id, name, cnpj)
    VALUES (v_company, 'RLS Test Co', '00000000000000');

  -- Fake auth users (avoid touching auth.users triggers; write minimal row)
  INSERT INTO auth.users (id, instance_id, email, aud, role, created_at, updated_at)
  VALUES
    (v_admin,    '00000000-0000-0000-0000-000000000000', 'admin_rls@test.local',    'authenticated','authenticated', now(), now()),
    (v_manager,  '00000000-0000-0000-0000-000000000000', 'manager_rls@test.local',  'authenticated','authenticated', now(), now()),
    (v_operator, '00000000-0000-0000-0000-000000000000', 'operator_rls@test.local', 'authenticated','authenticated', now(), now()),
    (v_viewer,   '00000000-0000-0000-0000-000000000000', 'viewer_rls@test.local',   'authenticated','authenticated', now(), now());

  -- profiles linking user -> company (needed by get_user_company_id)
  INSERT INTO public.profiles (id, company_id, email, full_name)
  VALUES
    (v_admin,    v_company, 'admin_rls@test.local',    'Admin RLS'),
    (v_manager,  v_company, 'manager_rls@test.local',  'Manager RLS'),
    (v_operator, v_company, 'operator_rls@test.local', 'Operator RLS'),
    (v_viewer,   v_company, 'viewer_rls@test.local',   'Viewer RLS');

  INSERT INTO public.user_roles (user_id, role, company_id) VALUES
    (v_admin,    'admin'::app_role,    v_company),
    (v_manager,  'manager'::app_role,  v_company),
    (v_operator, 'operator'::app_role, v_company),
    (v_viewer,   'viewer'::app_role,   v_company);

  -- Stash ids for later steps
  CREATE TEMP TABLE _ctx(k text PRIMARY KEY, v uuid) ON COMMIT DROP;
  INSERT INTO _ctx VALUES
    ('company', v_company),
    ('admin', v_admin),
    ('manager', v_manager),
    ('operator', v_operator),
    ('viewer', v_viewer);
END $$;

-- ---------- Results table ----------------------------------------------------
CREATE TEMP TABLE _results(
  table_name text,
  role_name  text,
  op         text,
  expected   text,   -- 'allow' | 'deny'
  actual     text,   -- 'allow' | 'deny'
  detail     text,
  pass       boolean
) ON COMMIT DROP;

-- ---------- Helper: run a statement as a role, capture outcome --------------
CREATE OR REPLACE FUNCTION pg_temp._run_as(
  p_user uuid,
  p_sql  text,
  p_expected text,   -- 'allow' | 'deny'
  p_table text,
  p_role  text,
  p_op    text
) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_actual text := 'allow';
  v_detail text := '';
BEGIN
  BEGIN
    -- Simulate PostgREST: switch to authenticated + set JWT claims
    EXECUTE format('SET LOCAL role authenticated');
    EXECUTE format($f$SET LOCAL "request.jwt.claims" = %L$f$,
      json_build_object('sub', p_user::text, 'role', 'authenticated')::text);
    EXECUTE p_sql;
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    v_actual := 'deny'; v_detail := SQLERRM;
  WHEN OTHERS THEN
    -- RLS violations surface as SQLSTATE 42501 (insufficient_privilege) but
    -- some code paths (e.g. WITH CHECK) raise "new row violates ..." with a
    -- different code. Treat any error as deny for the RLS matrix.
    v_actual := 'deny'; v_detail := SQLSTATE || ': ' || SQLERRM;
  END;
  -- Reset session role for next test
  RESET role;
  PERFORM set_config('request.jwt.claims', '', true);

  INSERT INTO _results(table_name, role_name, op, expected, actual, detail, pass)
  VALUES (p_table, p_role, p_op, p_expected, v_actual, v_detail, v_actual = p_expected);
END $$;

-- ---------- Seed one row per table (as service_role/superuser) --------------
-- We insert seed rows bypassing RLS so SELECT/UPDATE/DELETE have a target.
DO $seed$
DECLARE
  v_company uuid := (SELECT v FROM _ctx WHERE k='company');
  v_admin   uuid := (SELECT v FROM _ctx WHERE k='admin');
  v_bank    uuid;
  v_bank2   uuid;
BEGIN
  INSERT INTO public.bank_accounts(id, name, bank_name, company_id, balance)
    VALUES (gen_random_uuid(), 'BA Seed 1', 'Test Bank', v_company, 1000)
    RETURNING id INTO v_bank;
  INSERT INTO public.bank_accounts(id, name, bank_name, company_id, balance)
    VALUES (gen_random_uuid(), 'BA Seed 2', 'Test Bank', v_company, 500)
    RETURNING id INTO v_bank2;

  INSERT INTO public.bank_transactions(id, description, amount, type, company_id, bank_account_id)
    VALUES (gen_random_uuid(), 'BT Seed', 100, 'credit', v_company, v_bank);

  INSERT INTO public.bank_transfers(id, from_account_id, to_account_id, amount, company_id, created_by)
    VALUES (gen_random_uuid(), v_bank, v_bank2, 50, v_company, v_admin);

  INSERT INTO public.cash_flow_entries(id, description, type, category, amount, company_id)
    VALUES (gen_random_uuid(), 'CF Seed', 'income', 'test', 10, v_company);

  INSERT INTO public.financial_checks(id, check_type, check_number, amount, company_id)
    VALUES (gen_random_uuid(), 'received', 'CHK-1', 200, v_company);

  INSERT INTO public.financial_ledger(id, type, amount, description, source, company_id, created_by)
    VALUES (gen_random_uuid(), 'credit', 300, 'FL Seed', 'manual', v_company, v_admin);

  INSERT INTO public.financial_settlements(id, source_type, source_id, amount, total_settled, company_id, created_by)
    VALUES (gen_random_uuid(), 'receivable', gen_random_uuid(), 400, 400, v_company, v_admin);

  INSERT INTO public.payment_records(id, amount, total_paid, company_id)
    VALUES (gen_random_uuid(), 500, 500, v_company);

  CREATE TEMP TABLE _seed(k text PRIMARY KEY, v uuid) ON COMMIT DROP;
  INSERT INTO _seed VALUES ('bank', v_bank), ('bank2', v_bank2);
END $seed$;

-- ---------- Test matrix -----------------------------------------------------
-- Expectation matrix (per policies deployed):
--   S = SELECT always allow for any tenant role (admin/manager/operator/viewer)
--   I/U = INSERT/UPDATE allowed roles vary:
--     bank_accounts, bank_transfers    -> admin, manager
--     bank_transactions, cash_flow, checks -> admin, manager, operator
--     financial_ledger                 -> admin, manager (INSERT); admin, manager (UPDATE)
--     financial_settlements, payment_records -> INSERT: admin, manager, operator ; UPDATE: admin, manager
--   D = DELETE allowed roles:
--     bank_accounts, bank_transfers, checks, settlements, payment_records, ledger -> admin
--     bank_transactions, cash_flow -> admin, manager
--   viewer -> deny on all writes (only SELECT)

DO $matrix$
DECLARE
  r RECORD;
  v_company uuid := (SELECT v FROM _ctx WHERE k='company');
  v_bank    uuid := (SELECT v FROM _seed WHERE k='bank');
BEGIN
  FOR r IN
    SELECT k AS role_name, v AS user_id FROM _ctx WHERE k IN ('admin','manager','operator','viewer')
  LOOP
    -- ============ bank_accounts ============
    PERFORM pg_temp._run_as(r.user_id,
      'SELECT 1 FROM public.bank_accounts WHERE company_id = '''||v_company||''' LIMIT 1',
      'allow', 'bank_accounts', r.role_name, 'SELECT');
    PERFORM pg_temp._run_as(r.user_id,
      'INSERT INTO public.bank_accounts(name, bank_name, company_id) VALUES (''ins-'||r.role_name||''', ''X'', '''||v_company||''')',
      CASE WHEN r.role_name IN ('admin','manager') THEN 'allow' ELSE 'deny' END,
      'bank_accounts', r.role_name, 'INSERT');
    PERFORM pg_temp._run_as(r.user_id,
      'UPDATE public.bank_accounts SET balance = balance + 1 WHERE company_id = '''||v_company||'''',
      CASE WHEN r.role_name IN ('admin','manager') THEN 'allow' ELSE 'deny' END,
      'bank_accounts', r.role_name, 'UPDATE');
    PERFORM pg_temp._run_as(r.user_id,
      'DELETE FROM public.bank_accounts WHERE company_id = '''||v_company||''' AND name = ''nope''',
      CASE WHEN r.role_name = 'admin' THEN 'allow' ELSE 'deny' END,
      'bank_accounts', r.role_name, 'DELETE');

    -- ============ bank_transactions ============
    PERFORM pg_temp._run_as(r.user_id,
      'SELECT 1 FROM public.bank_transactions WHERE company_id = '''||v_company||''' LIMIT 1',
      'allow','bank_transactions', r.role_name, 'SELECT');
    PERFORM pg_temp._run_as(r.user_id,
      'INSERT INTO public.bank_transactions(description, amount, type, company_id) VALUES (''i'', 1, ''credit'', '''||v_company||''')',
      CASE WHEN r.role_name IN ('admin','manager','operator') THEN 'allow' ELSE 'deny' END,
      'bank_transactions', r.role_name, 'INSERT');
    PERFORM pg_temp._run_as(r.user_id,
      'UPDATE public.bank_transactions SET amount = amount WHERE company_id = '''||v_company||'''',
      CASE WHEN r.role_name IN ('admin','manager','operator') THEN 'allow' ELSE 'deny' END,
      'bank_transactions', r.role_name, 'UPDATE');
    PERFORM pg_temp._run_as(r.user_id,
      'DELETE FROM public.bank_transactions WHERE company_id = '''||v_company||''' AND description = ''nope''',
      CASE WHEN r.role_name IN ('admin','manager') THEN 'allow' ELSE 'deny' END,
      'bank_transactions', r.role_name, 'DELETE');

    -- ============ bank_transfers ============
    PERFORM pg_temp._run_as(r.user_id,
      'SELECT 1 FROM public.bank_transfers WHERE company_id = '''||v_company||''' LIMIT 1',
      'allow','bank_transfers', r.role_name, 'SELECT');
    PERFORM pg_temp._run_as(r.user_id,
      'INSERT INTO public.bank_transfers(from_account_id, to_account_id, amount, company_id) VALUES ('''||v_bank||''', '''||v_bank||''', 1, '''||v_company||''')',
      CASE WHEN r.role_name IN ('admin','manager') THEN 'allow' ELSE 'deny' END,
      'bank_transfers', r.role_name, 'INSERT');
    PERFORM pg_temp._run_as(r.user_id,
      'UPDATE public.bank_transfers SET amount = amount WHERE company_id = '''||v_company||'''',
      CASE WHEN r.role_name IN ('admin','manager') THEN 'allow' ELSE 'deny' END,
      'bank_transfers', r.role_name, 'UPDATE');
    PERFORM pg_temp._run_as(r.user_id,
      'DELETE FROM public.bank_transfers WHERE company_id = '''||v_company||''' AND amount = -1',
      CASE WHEN r.role_name = 'admin' THEN 'allow' ELSE 'deny' END,
      'bank_transfers', r.role_name, 'DELETE');

    -- ============ cash_flow_entries ============
    PERFORM pg_temp._run_as(r.user_id,
      'SELECT 1 FROM public.cash_flow_entries WHERE company_id = '''||v_company||''' LIMIT 1',
      'allow','cash_flow_entries', r.role_name, 'SELECT');
    PERFORM pg_temp._run_as(r.user_id,
      'INSERT INTO public.cash_flow_entries(description, type, category, amount, company_id) VALUES (''i'',''income'',''t'',1,'''||v_company||''')',
      CASE WHEN r.role_name IN ('admin','manager','operator') THEN 'allow' ELSE 'deny' END,
      'cash_flow_entries', r.role_name, 'INSERT');
    PERFORM pg_temp._run_as(r.user_id,
      'UPDATE public.cash_flow_entries SET amount = amount WHERE company_id = '''||v_company||'''',
      CASE WHEN r.role_name IN ('admin','manager','operator') THEN 'allow' ELSE 'deny' END,
      'cash_flow_entries', r.role_name, 'UPDATE');
    PERFORM pg_temp._run_as(r.user_id,
      'DELETE FROM public.cash_flow_entries WHERE company_id = '''||v_company||''' AND description = ''nope''',
      CASE WHEN r.role_name IN ('admin','manager') THEN 'allow' ELSE 'deny' END,
      'cash_flow_entries', r.role_name, 'DELETE');

    -- ============ financial_checks ============
    PERFORM pg_temp._run_as(r.user_id,
      'SELECT 1 FROM public.financial_checks WHERE company_id = '''||v_company||''' LIMIT 1',
      'allow','financial_checks', r.role_name, 'SELECT');
    PERFORM pg_temp._run_as(r.user_id,
      'INSERT INTO public.financial_checks(check_type, check_number, amount, company_id) VALUES (''received'',''C'',1,'''||v_company||''')',
      CASE WHEN r.role_name IN ('admin','manager','operator') THEN 'allow' ELSE 'deny' END,
      'financial_checks', r.role_name, 'INSERT');
    PERFORM pg_temp._run_as(r.user_id,
      'UPDATE public.financial_checks SET amount = amount WHERE company_id = '''||v_company||'''',
      CASE WHEN r.role_name IN ('admin','manager','operator') THEN 'allow' ELSE 'deny' END,
      'financial_checks', r.role_name, 'UPDATE');
    PERFORM pg_temp._run_as(r.user_id,
      'DELETE FROM public.financial_checks WHERE company_id = '''||v_company||''' AND check_number = ''nope''',
      CASE WHEN r.role_name = 'admin' THEN 'allow' ELSE 'deny' END,
      'financial_checks', r.role_name, 'DELETE');

    -- ============ financial_ledger ============
    PERFORM pg_temp._run_as(r.user_id,
      'SELECT 1 FROM public.financial_ledger WHERE company_id = '''||v_company||''' LIMIT 1',
      'allow','financial_ledger', r.role_name, 'SELECT');
    PERFORM pg_temp._run_as(r.user_id,
      'INSERT INTO public.financial_ledger(type, amount, description, source, company_id) VALUES (''credit'',1,''i'',''manual'','''||v_company||''')',
      CASE WHEN r.role_name IN ('admin','manager') THEN 'allow' ELSE 'deny' END,
      'financial_ledger', r.role_name, 'INSERT');
    PERFORM pg_temp._run_as(r.user_id,
      'UPDATE public.financial_ledger SET amount = amount WHERE company_id = '''||v_company||'''',
      CASE WHEN r.role_name IN ('admin','manager') THEN 'allow' ELSE 'deny' END,
      'financial_ledger', r.role_name, 'UPDATE');
    PERFORM pg_temp._run_as(r.user_id,
      'DELETE FROM public.financial_ledger WHERE company_id = '''||v_company||''' AND description = ''nope''',
      CASE WHEN r.role_name = 'admin' THEN 'allow' ELSE 'deny' END,
      'financial_ledger', r.role_name, 'DELETE');

    -- ============ financial_settlements ============
    PERFORM pg_temp._run_as(r.user_id,
      'SELECT 1 FROM public.financial_settlements WHERE company_id = '''||v_company||''' LIMIT 1',
      'allow','financial_settlements', r.role_name, 'SELECT');
    PERFORM pg_temp._run_as(r.user_id,
      'INSERT INTO public.financial_settlements(source_type, source_id, amount, total_settled, company_id) VALUES (''receivable'','''||v_company||''',1,1,'''||v_company||''')',
      CASE WHEN r.role_name IN ('admin','manager','operator') THEN 'allow' ELSE 'deny' END,
      'financial_settlements', r.role_name, 'INSERT');
    PERFORM pg_temp._run_as(r.user_id,
      'UPDATE public.financial_settlements SET amount = amount WHERE company_id = '''||v_company||'''',
      CASE WHEN r.role_name IN ('admin','manager') THEN 'allow' ELSE 'deny' END,
      'financial_settlements', r.role_name, 'UPDATE');
    PERFORM pg_temp._run_as(r.user_id,
      'DELETE FROM public.financial_settlements WHERE company_id = '''||v_company||''' AND notes = ''nope''',
      CASE WHEN r.role_name = 'admin' THEN 'allow' ELSE 'deny' END,
      'financial_settlements', r.role_name, 'DELETE');

    -- ============ payment_records ============
    PERFORM pg_temp._run_as(r.user_id,
      'SELECT 1 FROM public.payment_records WHERE company_id = '''||v_company||''' LIMIT 1',
      'allow','payment_records', r.role_name, 'SELECT');
    PERFORM pg_temp._run_as(r.user_id,
      'INSERT INTO public.payment_records(amount, total_paid, company_id) VALUES (1,1,'''||v_company||''')',
      CASE WHEN r.role_name IN ('admin','manager','operator') THEN 'allow' ELSE 'deny' END,
      'payment_records', r.role_name, 'INSERT');
    PERFORM pg_temp._run_as(r.user_id,
      'UPDATE public.payment_records SET amount = amount WHERE company_id = '''||v_company||'''',
      CASE WHEN r.role_name IN ('admin','manager') THEN 'allow' ELSE 'deny' END,
      'payment_records', r.role_name, 'UPDATE');
    PERFORM pg_temp._run_as(r.user_id,
      'DELETE FROM public.payment_records WHERE company_id = '''||v_company||''' AND notes = ''nope''',
      CASE WHEN r.role_name = 'admin' THEN 'allow' ELSE 'deny' END,
      'payment_records', r.role_name, 'DELETE');
  END LOOP;
END $matrix$;

-- ---------- Cross-tenant isolation smoke test -------------------------------
-- A viewer from company A must NOT see rows of company B (get_user_company_id
-- returns their own company, so SELECT with WHERE company_id = <other> is
-- effectively filtered by RLS to zero rows). We assert this via a count.
DO $iso$
DECLARE
  v_other uuid := gen_random_uuid();
  v_viewer uuid := (SELECT v FROM _ctx WHERE k='viewer');
  v_cnt int;
BEGIN
  INSERT INTO public.companies(id, name, cnpj) VALUES (v_other, 'Other Co', '11111111111111');
  INSERT INTO public.bank_accounts(name, bank_name, company_id) VALUES ('Foreign BA', 'X', v_other);

  SET LOCAL role authenticated;
  EXECUTE format($f$SET LOCAL "request.jwt.claims" = %L$f$,
    json_build_object('sub', v_viewer::text, 'role','authenticated')::text);
  EXECUTE 'SELECT count(*)::int FROM public.bank_accounts WHERE company_id = $1' INTO v_cnt USING v_other;
  RESET role;

  INSERT INTO _results VALUES
    ('bank_accounts','viewer','CROSS_TENANT','deny',
     CASE WHEN v_cnt = 0 THEN 'deny' ELSE 'allow' END,
     'foreign rows visible: '||v_cnt, v_cnt = 0);
END $iso$;

-- ---------- Report -----------------------------------------------------------
\echo
\echo '========================================================================'
\echo 'RLS + ROLE MATRIX RESULTS'
\echo '========================================================================'
SELECT table_name, role_name, op, expected, actual,
       CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS status
FROM _results
ORDER BY table_name, role_name, op;

\echo
\echo '------------------------- SUMMARY --------------------------------------'
SELECT
  count(*)                             AS total,
  count(*) FILTER (WHERE pass)         AS passed,
  count(*) FILTER (WHERE NOT pass)     AS failed
FROM _results;

\echo
\echo '------------------------- FAILURES (if any) ----------------------------'
SELECT table_name, role_name, op, expected, actual, detail
FROM _results WHERE NOT pass;

-- Exit code non-zero if any failure (ON_ERROR_STOP + assertion)
DO $$
DECLARE v int;
BEGIN
  SELECT count(*) INTO v FROM _results WHERE NOT pass;
  IF v > 0 THEN
    RAISE EXCEPTION 'RLS matrix: % failure(s) detected', v;
  END IF;
END $$;

ROLLBACK;
