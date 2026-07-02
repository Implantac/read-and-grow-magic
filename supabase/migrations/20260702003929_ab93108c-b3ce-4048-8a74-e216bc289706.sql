
-- Sprint 1: ATP + Credit engine (idempotent)

CREATE OR REPLACE FUNCTION public.check_credit(
  _client_id uuid,
  _order_total numeric
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_limit numeric := 0;
  v_ar_open numeric := 0;
  v_orders_pending numeric := 0;
  v_available numeric := 0;
  v_status text;
  v_profile RECORD;
BEGIN
  -- resolve tenant from client
  SELECT company_id INTO v_company_id FROM public.clients WHERE id = _client_id;
  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('approved', false, 'blocked_reason', 'Cliente não encontrado');
  END IF;

  -- credit profile (optional)
  SELECT credit_limit, status
    INTO v_profile
    FROM public.customer_credit_profiles
   WHERE client_id = _client_id
   LIMIT 1;

  v_limit := COALESCE(v_profile.credit_limit, 0);
  v_status := COALESCE(v_profile.status, 'no_profile');

  -- open AR
  SELECT COALESCE(SUM(amount - COALESCE(paid_amount,0)), 0)
    INTO v_ar_open
    FROM public.accounts_receivable
   WHERE client_id = _client_id
     AND status IN ('pending','overdue','partial');

  -- pending orders (not yet invoiced)
  SELECT COALESCE(SUM(total_amount), 0)
    INTO v_orders_pending
    FROM public.orders
   WHERE client_id = _client_id
     AND status IN ('pending','approved','picking','packing');

  v_available := v_limit - v_ar_open - v_orders_pending;

  RETURN jsonb_build_object(
    'approved',       v_available >= _order_total AND v_status <> 'blocked',
    'credit_limit',   v_limit,
    'ar_open',        v_ar_open,
    'orders_pending', v_orders_pending,
    'available_limit', v_available,
    'profile_status', v_status,
    'blocked_reason', CASE
       WHEN v_status = 'blocked' THEN 'Cliente com crédito bloqueado'
       WHEN v_available < _order_total THEN 'Limite de crédito insuficiente'
       ELSE NULL
    END
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_credit(uuid, numeric) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.check_credit(uuid, numeric) TO authenticated;


CREATE OR REPLACE FUNCTION public.check_atp(
  _product_id uuid,
  _qty numeric,
  _due_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_on_hand numeric := 0;
  v_reserved numeric := 0;
  v_incoming numeric := 0;
  v_available numeric := 0;
  v_next_incoming date;
BEGIN
  SELECT company_id INTO v_company_id FROM public.products WHERE id = _product_id;
  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('status','red','blocked_reason','Produto não encontrado');
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO v_on_hand
    FROM public.stock_balances WHERE product_id = _product_id;

  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
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
$$;

REVOKE EXECUTE ON FUNCTION public.check_atp(uuid, numeric, date) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.check_atp(uuid, numeric, date) TO authenticated;
