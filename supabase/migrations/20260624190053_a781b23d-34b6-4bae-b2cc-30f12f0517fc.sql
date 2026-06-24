
-- Generic audit trigger for sensitive tables
CREATE OR REPLACE FUNCTION public.fn_audit_sensitive_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_entity_id uuid;
  v_old jsonb;
  v_new jsonb;
BEGIN
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_entity_id := (to_jsonb(OLD)->>'id')::uuid;
    v_company_id := NULLIF(to_jsonb(OLD)->>'company_id','')::uuid;
  ELSIF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_entity_id := (to_jsonb(NEW)->>'id')::uuid;
    v_company_id := NULLIF(to_jsonb(NEW)->>'company_id','')::uuid;
  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_entity_id := (to_jsonb(NEW)->>'id')::uuid;
    v_company_id := NULLIF(to_jsonb(NEW)->>'company_id','')::uuid;
  END IF;

  INSERT INTO public.system_audit_logs
    (user_id, company_id, action, module, entity_name, entity_id, old_data, new_data)
  VALUES
    (v_user_id, v_company_id, TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME, v_entity_id, v_old, v_new);

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- never block the mutation due to audit failure
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach to sensitive tables (idempotent via DROP IF EXISTS)
DO $$
DECLARE
  t text;
  sensitive text[] := ARRAY[
    'user_roles',
    'profiles',
    'companies',
    'ai_brain_decisions',
    'accounts_payable',
    'accounts_receivable',
    'financial_ledger',
    'bank_accounts',
    'production_orders',
    'fiscal_documents',
    'tax_rules'
  ];
BEGIN
  FOREACH t IN ARRAY sensitive LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
      EXECUTE format(
        'CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fn_audit_sensitive_mutation()',
        t, t
      );
    END IF;
  END LOOP;
END $$;
