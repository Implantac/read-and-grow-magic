-- Hardening Sprint: FASE 3 — RLS Hardening & Type Safety (Retry with IF NOT EXISTS/DROP)
-- Fix permissive RLS policies for stock and financial logs, and revoke public access to internal functions.

-- 1. Hardening public.stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can read stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Auth users can insert stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Auth users can update stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Auth users can delete stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_select" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_modify" ON public.stock_movements;

CREATE POLICY "stock_movements_select" ON public.stock_movements
  FOR SELECT TO authenticated
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "stock_movements_insert" ON public.stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "stock_movements_modify" ON public.stock_movements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;

-- 2. Hardening public.wms_movements
ALTER TABLE public.wms_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can read wms_movements" ON public.wms_movements;
DROP POLICY IF EXISTS "Auth users can insert wms_movements" ON public.wms_movements;
DROP POLICY IF EXISTS "Auth users can update wms_movements" ON public.wms_movements;
DROP POLICY IF EXISTS "Auth users can delete wms_movements" ON public.wms_movements;
DROP POLICY IF EXISTS "wms_movements_select" ON public.wms_movements;
DROP POLICY IF EXISTS "wms_movements_insert" ON public.wms_movements;

CREATE POLICY "wms_movements_select" ON public.wms_movements
  FOR SELECT TO authenticated
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "wms_movements_insert" ON public.wms_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

GRANT SELECT, INSERT ON public.wms_movements TO authenticated;
GRANT ALL ON public.wms_movements TO service_role;

-- 3. Hardening public.payment_records
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users manage payment_records" ON public.payment_records;
DROP POLICY IF EXISTS "payment_records_select" ON public.payment_records;
DROP POLICY IF EXISTS "payment_records_insert" ON public.payment_records;

CREATE POLICY "payment_records_select" ON public.payment_records
  FOR SELECT TO authenticated
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "payment_records_insert" ON public.payment_records
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

GRANT SELECT, INSERT ON public.payment_records TO authenticated;
GRANT ALL ON public.payment_records TO service_role;

-- 4. Revoking Public Execute on critical functions
REVOKE EXECUTE ON FUNCTION public.run_financial_audit(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_financial_audit(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.sync_wms_movement_to_stock() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_wms_movement_to_stock() TO service_role;
