
CREATE OR REPLACE FUNCTION public.log_sales_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_entity uuid;
  v_action text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'insert';
    v_entity := NEW.id;
    v_company := NEW.company_id;
    v_new := to_jsonb(NEW);
    v_old := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_entity := NEW.id;
    v_company := NEW.company_id;
    v_new := to_jsonb(NEW);
    v_old := to_jsonb(OLD);
  ELSE
    v_action := 'delete';
    v_entity := OLD.id;
    v_company := OLD.company_id;
    v_new := NULL;
    v_old := to_jsonb(OLD);
  END IF;

  INSERT INTO public.system_audit_logs (
    user_id, company_id, action, module, entity_name, entity_id, old_data, new_data
  ) VALUES (
    auth.uid(), v_company, v_action, 'commercial', 'sales', v_entity, v_old, v_new
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_sales_audit ON public.sales;
CREATE TRIGGER trigger_sales_audit
AFTER INSERT OR UPDATE OR DELETE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.log_sales_audit();
