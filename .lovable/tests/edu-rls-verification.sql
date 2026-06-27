-- =====================================================================
-- Verificação de RLS multi-tenant: módulo Educação
-- =====================================================================
-- Roda como super-admin (psql via env PG*). Substitui get_user_company_id
-- temporariamente para ler o company_id do JWT claim, simula dois tenants
-- e verifica que User A NÃO enxerga nada de User B em
-- edu_schools / edu_classes / edu_students / edu_enrollments.
--
--   psql -f .lovable/tests/edu-rls-verification.sql
--
-- Toda a transação termina em ROLLBACK; nenhum dado é persistido e a
-- função original é restaurada automaticamente.
-- =====================================================================

BEGIN;

-- 1) Substitui get_user_company_id para ler claim "company_id" do JWT.
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb ->> 'company_id',
    ''
  )::uuid;
$$;

-- 2) Seed isolado (apenas tabelas edu_*, sem FK para companies).
DO $$
DECLARE
  v_company_a uuid := gen_random_uuid();
  v_company_b uuid := gen_random_uuid();
  v_school_a  uuid;
  v_class_a   uuid;
  v_student_a uuid;
BEGIN
  PERFORM set_config('lovable.test_company_a', v_company_a::text, true);
  PERFORM set_config('lovable.test_company_b', v_company_b::text, true);

  INSERT INTO public.edu_schools (company_id, name)
    VALUES (v_company_a, 'Escola Alpha (A)') RETURNING id INTO v_school_a;
  INSERT INTO public.edu_schools (company_id, name)
    VALUES (v_company_b, 'Escola Bravo (B)');

  INSERT INTO public.edu_classes (company_id, school_id, name, academic_year, capacity)
    VALUES (v_company_a, v_school_a, 'Turma A1', 2026, 30) RETURNING id INTO v_class_a;

  INSERT INTO public.edu_students (company_id, full_name)
    VALUES (v_company_a, 'Aluno A1') RETURNING id INTO v_student_a;

  INSERT INTO public.edu_enrollments (company_id, student_id, class_id, monthly_fee)
    VALUES (v_company_a, v_student_a, v_class_a, 850);
END $$;

-- 3) Helper para assumir um usuário/tenant via JWT claims.
CREATE OR REPLACE FUNCTION pg_temp.assume(_company uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object(
      'sub',        gen_random_uuid()::text,
      'role',       'authenticated',
      'company_id', _company::text
    )::text,
    true
  );
END $$;

-- 4) Asserções
SET LOCAL ROLE authenticated;

-- --- Tenant A vê apenas o que é dele ---
SELECT pg_temp.assume(current_setting('lovable.test_company_a')::uuid);

SELECT CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS status,
       'A vê 1 escola própria' AS check, COUNT(*) AS rows
FROM public.edu_schools;

SELECT CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END,
       'A vê 1 turma própria', COUNT(*)
FROM public.edu_classes;

SELECT CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END,
       'A vê 1 aluno próprio', COUNT(*)
FROM public.edu_students;

SELECT CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END,
       'A vê 1 matrícula própria', COUNT(*)
FROM public.edu_enrollments;

-- --- Tenant B NÃO vê nada de A ---
SELECT pg_temp.assume(current_setting('lovable.test_company_b')::uuid);

SELECT CASE WHEN COUNT(*) = 1 AND bool_and(name = 'Escola Bravo (B)') THEN 'PASS' ELSE 'FAIL' END,
       'B só vê escola própria (não A)', COUNT(*)
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

-- --- B tentando escrever no tenant A deve ser bloqueado pela RLS (WITH CHECK) ---
DO $$
DECLARE v_company_a uuid := current_setting('lovable.test_company_a')::uuid;
BEGIN
  BEGIN
    INSERT INTO public.edu_schools (company_id, name) VALUES (v_company_a, 'Invasão B->A');
    RAISE NOTICE 'FAIL: insert cross-tenant aceito';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASS: insert cross-tenant bloqueado (%)', SQLERRM;
  END;
END $$;

ROLLBACK;
