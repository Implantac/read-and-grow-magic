
-- Helper: caller may access a given company (null auth.uid() = internal/service_role)
CREATE OR REPLACE FUNCTION public.can_access_company(_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_own uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN true; -- internal calls (service_role, triggers, cron)
  END IF;
  IF _company_id IS NULL THEN
    RETURN false;
  END IF;
  SELECT company_id INTO v_own FROM public.profiles WHERE id = v_user;
  IF v_own IS NULL THEN
    RETURN false;
  END IF;
  IF v_own = _company_id THEN
    RETURN true;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.get_consolidated_company_ids(v_own) AS c(id)
    WHERE c.id = _company_id
  );
EXCEPTION WHEN others THEN
  RETURN v_own = _company_id;
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_company(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_company(uuid) TO authenticated, service_role;

-- DRE managerial: scope to caller's company
CREATE OR REPLACE FUNCTION public.dre_managerial(p_company_id uuid, p_from date, p_to date)
 RETURNS TABLE(cost_center_id uuid, cost_center_code text, cost_center_name text, dre_section text, category_id uuid, category_name text, category_type text, total_amount numeric, entry_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    cc.id AS cost_center_id,
    COALESCE(cc.code, '—') AS cost_center_code,
    COALESCE(cc.name, 'Sem centro de custo') AS cost_center_name,
    COALESCE(fc.dre_section, 'outros') AS dre_section,
    fc.id AS category_id,
    COALESCE(fc.name, 'Sem categoria') AS category_name,
    COALESCE(fc.type, fl.type) AS category_type,
    SUM(CASE WHEN COALESCE(fc.type, fl.type) = 'receita' THEN fl.amount ELSE -fl.amount END) AS total_amount,
    COUNT(*)::bigint AS entry_count
  FROM public.financial_ledger fl
  LEFT JOIN public.cost_centers cc ON cc.id = fl.cost_center_id
  LEFT JOIN public.financial_categories fc ON fc.id = fl.category_id
  WHERE fl.company_id = p_company_id
    AND public.can_access_company(p_company_id)
    AND fl.entry_date BETWEEN p_from AND p_to
  GROUP BY cc.id, cc.code, cc.name, fc.dre_section, fc.id, fc.name, fc.type, fl.type
  ORDER BY cost_center_name, dre_section, category_name;
$function$;

CREATE OR REPLACE FUNCTION public.dre_managerial_entries(p_company_id uuid, p_from date, p_to date, p_cost_center_id uuid DEFAULT NULL::uuid, p_category_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, entry_date date, description text, type text, amount numeric, category_name text, cost_center_name text, source text, reference text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    fl.id,
    fl.entry_date,
    fl.description,
    fl.type,
    fl.amount,
    COALESCE(fc.name, 'Sem categoria') AS category_name,
    COALESCE(cc.name, 'Sem centro de custo') AS cost_center_name,
    fl.source,
    fl.reference
  FROM public.financial_ledger fl
  LEFT JOIN public.cost_centers cc ON cc.id = fl.cost_center_id
  LEFT JOIN public.financial_categories fc ON fc.id = fl.category_id
  WHERE fl.company_id = p_company_id
    AND public.can_access_company(p_company_id)
    AND fl.entry_date BETWEEN p_from AND p_to
    AND (p_cost_center_id IS NULL OR fl.cost_center_id IS NOT DISTINCT FROM p_cost_center_id)
    AND (p_category_id IS NULL OR fl.category_id IS NOT DISTINCT FROM p_category_id)
  ORDER BY fl.entry_date DESC, fl.id DESC
  LIMIT 500;
$function$;

-- check_credit: tenant guard
CREATE OR REPLACE FUNCTION public.check_credit(_client_id uuid, _order_total numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
  v_limit numeric := 0;
  v_ar_open numeric := 0;
  v_orders_pending numeric := 0;
  v_available numeric := 0;
  v_status text;
  v_profile RECORD;
BEGIN
  SELECT company_id INTO v_company_id FROM public.clients WHERE id = _client_id;
  IF v_company_id IS NULL OR NOT public.can_access_company(v_company_id) THEN
    RETURN jsonb_build_object('approved', false, 'blocked_reason', 'Cliente não encontrado');
  END IF;

  SELECT credit_limit, credit_status
    INTO v_profile
    FROM public.customer_credit_profiles
   WHERE client_id = _client_id
   LIMIT 1;

  v_limit  := COALESCE(v_profile.credit_limit, 0);
  v_status := COALESCE(v_profile.credit_status, 'no_profile');

  SELECT COALESCE(SUM(amount - COALESCE(paid_amount, 0)), 0)
    INTO v_ar_open
    FROM public.accounts_receivable
   WHERE client_id = _client_id
     AND status IN ('pending','overdue','partial');

  SELECT COALESCE(SUM(total), 0)
    INTO v_orders_pending
    FROM public.orders
   WHERE client_id = _client_id
     AND status IN ('pending','approved','picking','packing');

  v_available := v_limit - v_ar_open - v_orders_pending;

  RETURN jsonb_build_object(
    'approved',        v_available >= _order_total AND v_status <> 'blocked',
    'credit_limit',    v_limit,
    'ar_open',         v_ar_open,
    'orders_pending',  v_orders_pending,
    'available_limit', v_available,
    'profile_status',  v_status,
    'blocked_reason',  CASE
       WHEN v_status = 'blocked' THEN 'Cliente com crédito bloqueado'
       WHEN v_available < _order_total THEN 'Limite de crédito insuficiente'
       ELSE NULL
    END
  );
END;
$function$;

-- check_atp: tenant guard
CREATE OR REPLACE FUNCTION public.check_atp(_product_id uuid, _qty numeric, _due_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
  v_on_hand numeric := 0;
  v_reserved numeric := 0;
  v_incoming numeric := 0;
  v_available numeric := 0;
  v_next_incoming date;
BEGIN
  SELECT company_id INTO v_company_id FROM public.products WHERE id = _product_id;
  IF v_company_id IS NULL OR NOT public.can_access_company(v_company_id) THEN
    RETURN jsonb_build_object('status','red','blocked_reason','Produto não encontrado');
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO v_on_hand
    FROM public.stock_balances WHERE product_id = _product_id;

  SELECT COALESCE(SUM(reserved_qty), 0) INTO v_reserved
    FROM public.stock_reservations
   WHERE product_id = _product_id AND status IN ('pending','active');

  SELECT COALESCE(SUM(quantity), 0), MIN(due_date)
    INTO v_incoming, v_next_incoming
    FROM public.production_orders
   WHERE product_id = _product_id
     AND status IN ('planned','scheduled','in_progress')
     AND (_due_date IS NULL OR due_date <= _due_date);

  v_available := v_on_hand - v_reserved;

  RETURN jsonb_build_object(
    'status', CASE
       WHEN v_available >= _qty THEN 'green'
       WHEN (v_available + v_incoming) >= _qty THEN 'amber'
       ELSE 'red'
    END,
    'on_hand',   v_on_hand,
    'reserved',  v_reserved,
    'available', v_available,
    'incoming',  v_incoming,
    'next_incoming_date', v_next_incoming,
    'requested', _qty
  );
END;
$function$;

-- increment_usage: only own company for authenticated callers
CREATE OR REPLACE FUNCTION public.increment_usage(_company_id uuid, _metric text, _delta integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _period text := public.current_billing_period();
  _plan_limit integer;
  _new_value integer;
BEGIN
  IF _company_id IS NULL OR _metric IS NULL THEN
    RAISE EXCEPTION 'company_id and metric are required';
  END IF;

  IF auth.uid() IS NOT NULL AND NOT public.can_access_company(_company_id) THEN
    RAISE EXCEPTION 'not allowed for this company';
  END IF;

  SELECT CASE _metric
           WHEN 'orders'    THEN p.max_orders_month
           WHEN 'nfe'       THEN p.nfe_per_month
           WHEN 'ai_calls'  THEN p.ai_calls_per_month
           WHEN 'users'     THEN p.max_users
           WHEN 'branches'  THEN p.max_branches
           ELSE NULL
         END
    INTO _plan_limit
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
   WHERE s.company_id = _company_id
     AND s.status IN ('active','trialing')
   ORDER BY s.created_at DESC
   LIMIT 1;

  INSERT INTO public.usage_tracking (company_id, metric, current_value, limit_value, period, updated_at)
  VALUES (_company_id, _metric, GREATEST(_delta, 0), _plan_limit, _period, now())
  ON CONFLICT (company_id, metric, period)
  DO UPDATE SET
    current_value = public.usage_tracking.current_value + _delta,
    limit_value   = COALESCE(EXCLUDED.limit_value, public.usage_tracking.limit_value),
    updated_at    = now()
  RETURNING current_value INTO _new_value;

  RETURN _new_value;
END;
$function$;
