
-- Only create tables/policies that don't exist yet
CREATE TABLE IF NOT EXISTS public.wms_packing_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  volumes INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  operator TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  tracking_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.wms_packing_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can read wms_packing_orders" ON public.wms_packing_orders;
CREATE POLICY "Auth users can read wms_packing_orders" ON public.wms_packing_orders FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Auth users can insert wms_packing_orders" ON public.wms_packing_orders;
CREATE POLICY "Auth users can insert wms_packing_orders" ON public.wms_packing_orders FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Auth users can update wms_packing_orders" ON public.wms_packing_orders;
CREATE POLICY "Auth users can update wms_packing_orders" ON public.wms_packing_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Auth users can delete wms_packing_orders" ON public.wms_packing_orders;
CREATE POLICY "Auth users can delete wms_packing_orders" ON public.wms_packing_orders FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'credit',
  bank_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  matched_entry_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users can read bank_transactions" ON public.bank_transactions;
CREATE POLICY "Auth users can read bank_transactions" ON public.bank_transactions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Auth users can insert bank_transactions" ON public.bank_transactions;
CREATE POLICY "Auth users can insert bank_transactions" ON public.bank_transactions FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Auth users can update bank_transactions" ON public.bank_transactions;
CREATE POLICY "Auth users can update bank_transactions" ON public.bank_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Auth users can delete bank_transactions" ON public.bank_transactions;
CREATE POLICY "Auth users can delete bank_transactions" ON public.bank_transactions FOR DELETE TO authenticated USING (true);
