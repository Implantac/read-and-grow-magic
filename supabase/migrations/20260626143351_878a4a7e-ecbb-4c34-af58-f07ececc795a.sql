
CREATE OR REPLACE FUNCTION public.fn_audit_sensitive_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_entity_id uuid;
  v_old jsonb;
  v_new jsonb;
  v_row jsonb;
BEGIN
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_row := v_old;
  ELSIF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_row := v_new;
  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_row := v_new;
  END IF;

  v_entity_id := NULLIF(v_row->>'id','')::uuid;

  -- Para a tabela companies, o próprio id é o company_id (não há coluna company_id).
  IF TG_TABLE_NAME = 'companies' THEN
    v_company_id := v_entity_id;
  ELSE
    v_company_id := NULLIF(v_row->>'company_id','')::uuid;
  END IF;

  INSERT INTO public.system_audit_logs
    (user_id, company_id, action, module, entity_name, entity_id, old_data, new_data)
  VALUES
    (v_user_id, v_company_id, TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME, v_entity_id, v_old, v_new);

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RETURN COALESCE(NEW, OLD);
END;
$function$;
