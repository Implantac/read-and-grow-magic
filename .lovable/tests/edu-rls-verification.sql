-- =====================================================================
-- Verificação de RLS multi-tenant: módulo Educação
-- =====================================================================
-- Executa como super-admin (psql via PG* env). Simula dois tenants e
-- garante que um usuário do tenant A NUNCA enxerga dados do tenant B
-- em edu_schools / edu_classes / edu_students / edu_enrollments.
--
-- Uso:
--   psql -f .lovable/tests/edu-rls-verification.sql
--
-- Saída esperada: todas as linhas com status = 'PASS'.
-- =====================================================================

BEGIN;
ALTER TABLE public.companies DISABLE TRIGGER trg_setup_fiscal_on_company_creation;

-- ---------- Seed isolado ----------
DO $$
DECLARE
  v_company_a uuid := gen_random_uuid();
  v_company_b uuid := gen_random_uuid();
  v_user_a    uuid := gen_random_uuid();
  v_user_b    uuid := gen_random_uuid();
  v_school_a  uuid;
  v_school_b  uuid;
  v_class_a   uuid;
  v_student_a uuid;
BEGIN
  PERFORM set_config('lovable.test_company_a', v_company_a::text, true);
  PERFORM set_config('lovable.test_company_b', v_company_b::text, true);
  PERFORM set_config('lovable.test_user_a',    v_user_a::text,    true);
  PERFORM set_config('lovable.test_user_b',    v_user_b::text,    true);

  INSERT INTO public.companies (id, name, cnpj) VALUES
    (v_company_a, 'RLS Test Tenant A', '00000000000001'),
    (v_company_b, 'RLS Test Tenant B', '00000000000002');

  INSERT INTO public.profiles (id, company_id, name) VALUES
    (v_user_a, v_company_a, 'User A'),
    (v_user_b, v_company_b, 'User B');

  INSERT INTO public.edu_schools (company_id, name)
    VALUES (v_company_a, 'Escola Alpha') RETURNING id INTO v_school_a;
  INSERT INTO public.edu_schools (company_id, name)
    VALUES (v_company_b, 'Escola Bravo') RETURNING id INTO v_school_b;

  INSERT INTO public.edu_classes (company_id, school_id, name, academic_year, capacity)
    VALUES (v_company_a, v_school_a, 'Turma A1', 2026, 30) RETURNING id INTO v_class_a;

  INSERT INTO public.edu_students (company_id, full_name)
    VALUES (v_company_a, 'Aluno A1') RETURNING id INTO v_student_a;

  INSERT INTO public.edu_enrollments (company_id, student_id, class_id, monthly_fee)
    VALUES (v_company_a, v_student_a, v_class_a, 850);
END $$;

-- ---------- Helper: troca para o papel authenticated e fixa JWT ----------
CREATE OR REPLACE FUNCTION pg_temp.assume_user(_uid uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', _uid::text, 'role', 'authenticated')::text, true);
END $$;

-- ---------- Testes ----------
-- Como User A: só vê dados do tenant A
SELECT pg_temp.assume_user(current_setting('lovable.test_user_a')::uuid);

SELECT CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status,
       'A vê apenas suas escolas'  AS check, COUNT(*) AS rows
FROM public.edu_schools;

SELECT CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END,
       'A vê apenas suas turmas', COUNT(*)
FROM public.edu_classes;

SELECT CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END,
       'A vê apenas seus alunos', COUNT(*)
FROM public.edu_students;

SELECT CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END,
       'A vê apenas suas matrículas', COUNT(*)
FROM public.edu_enrollments;

-- Como User B: NÃO vê nada do tenant A
SELECT pg_temp.assume_user(current_setting('lovable.test_user_b')::uuid);

SELECT CASE WHEN COUNT(*) = 1 AND bool_and(name = 'Escola Bravo') THEN 'PASS' ELSE 'FAIL' END,
       'B não vê escolas de A', COUNT(*)
FROM public.edu_schools;

SELECT CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
       'B não vê turmas de A', COUNT(*)
FROM public.edu_classes;

SELECT CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
       'B não vê alunos de A', COUNT(*)
FROM public.edu_students;

SELECT CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
       'B não vê matrículas de A', COUNT(*)
FROM public.edu_enrollments;

-- Tentativa de escrita cross-tenant (B inserindo no tenant A) deve falhar
DO $$
DECLARE v_err text; v_company_a uuid := current_setting('lovable.test_company_a')::uuid;
BEGIN
  BEGIN
    INSERT INTO public.edu_schools (company_id, name) VALUES (v_company_a, 'Invasão');
    RAISE NOTICE 'FAIL: insert cross-tenant aceito';
  EXCEPTION WHEN insufficient_privilege OR check_violation OR others THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    RAISE NOTICE 'PASS: insert cross-tenant bloqueado (%)', v_err;
  END;
END $$;

ROLLBACK;
