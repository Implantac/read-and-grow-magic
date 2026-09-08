DROP POLICY IF EXISTS "stock_movements_select" ON public.stock_movements;

REVOKE ALL ON FUNCTION public.adjust_stock(uuid, uuid, numeric, numeric, numeric) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.get_branch_daily_demand(uuid, integer) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.on_movement_status_change() FROM anon, authenticated, PUBLIC;

REVOKE ALL ON public.client_commercial_profiles FROM anon, authenticated;

ALTER TABLE public.idempotency_keys
  DROP CONSTRAINT IF EXISTS idempotency_keys_idempotency_key_company_id_key;
ALTER TABLE public.idempotency_keys
  ADD CONSTRAINT idempotency_keys_key_company_path_key
  UNIQUE (idempotency_key, company_id, request_path);