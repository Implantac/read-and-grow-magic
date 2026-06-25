
-- Core dispatcher function: matches active automation_rules and records runs
CREATE OR REPLACE FUNCTION public.fn_emit_automation_event(
  _company_id uuid,
  _event text,
  _context jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  cond jsonb;
  ok boolean;
  field text;
  op text;
  val jsonb;
  ctx_val jsonb;
BEGIN
  IF _company_id IS NULL OR _event IS NULL THEN RETURN; END IF;

  FOR r IN
    SELECT id, conditions, actions
      FROM public.automation_rules
     WHERE company_id = _company_id
       AND trigger_event = _event
       AND is_active = true
  LOOP
    ok := true;
    IF jsonb_typeof(r.conditions) = 'array' THEN
      FOR cond IN SELECT * FROM jsonb_array_elements(COALESCE(r.conditions, '[]'::jsonb))
      LOOP
        field := cond->>'field';
        op := COALESCE(cond->>'operator', 'eq');
        val := cond->'value';
        ctx_val := _context->field;
        IF op = 'eq' AND ctx_val IS DISTINCT FROM val THEN ok := false; EXIT; END IF;
        IF op = 'neq' AND ctx_val = val THEN ok := false; EXIT; END IF;
        IF op = 'gt' AND NOT ((ctx_val)::text::numeric > (val)::text::numeric) THEN ok := false; EXIT; END IF;
        IF op = 'lt' AND NOT ((ctx_val)::text::numeric < (val)::text::numeric) THEN ok := false; EXIT; END IF;
        IF op = 'contains' AND position((val#>>'{}') in COALESCE(ctx_val#>>'{}', '')) = 0 THEN ok := false; EXIT; END IF;
      END LOOP;
    END IF;

    IF ok THEN
      INSERT INTO public.automation_runs(company_id, rule_id, status, input, output)
      VALUES (_company_id, r.id, 'success', _context, jsonb_build_object('actions', r.actions));
    END IF;
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  -- never block the host transaction
  RAISE WARNING 'fn_emit_automation_event failed: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_emit_automation_event(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_emit_automation_event(uuid, text, jsonb) TO authenticated, service_role;

-- Generic trigger function: derives event name from TG_ARGV
CREATE OR REPLACE FUNCTION public.fn_trigger_emit_automation_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix text := TG_ARGV[0];
  event text;
  row_data jsonb;
  cid uuid;
BEGIN
  row_data := to_jsonb(COALESCE(NEW, OLD));
  cid := NULLIF(row_data->>'company_id','')::uuid;
  IF cid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  IF TG_OP = 'INSERT' THEN
    event := prefix || '.created';
  ELSIF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW)->>'status') IS DISTINCT FROM (to_jsonb(OLD)->>'status') THEN
      event := prefix || '.status_changed';
      row_data := row_data || jsonb_build_object(
        'previous_status', to_jsonb(OLD)->>'status',
        'new_status', to_jsonb(NEW)->>'status'
      );
    ELSE
      event := prefix || '.updated';
    END IF;
  ELSE
    event := prefix || '.deleted';
  END IF;

  PERFORM public.fn_emit_automation_event(cid, event, row_data);
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_trigger_emit_automation_event() FROM PUBLIC;

-- Wire triggers on key operational tables
DROP TRIGGER IF EXISTS trg_automation_orders ON public.orders;
CREATE TRIGGER trg_automation_orders
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_emit_automation_event('order');

DROP TRIGGER IF EXISTS trg_automation_ap ON public.accounts_payable;
CREATE TRIGGER trg_automation_ap
AFTER INSERT OR UPDATE OR DELETE ON public.accounts_payable
FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_emit_automation_event('accounts_payable');

DROP TRIGGER IF EXISTS trg_automation_ar ON public.accounts_receivable;
CREATE TRIGGER trg_automation_ar
AFTER INSERT OR UPDATE OR DELETE ON public.accounts_receivable
FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_emit_automation_event('accounts_receivable');

DROP TRIGGER IF EXISTS trg_automation_production_orders ON public.production_orders;
CREATE TRIGGER trg_automation_production_orders
AFTER INSERT OR UPDATE OR DELETE ON public.production_orders
FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_emit_automation_event('production_order');

DROP TRIGGER IF EXISTS trg_automation_nfe ON public.nfe;
CREATE TRIGGER trg_automation_nfe
AFTER INSERT OR UPDATE OR DELETE ON public.nfe
FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_emit_automation_event('nfe');
