
-- 1) NFC-e: motivo e status de devolução
ALTER TABLE public.nfce
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS return_status text NOT NULL DEFAULT 'none'
    CHECK (return_status IN ('none','partial','full'));

-- 2) Devoluções de cupom
CREATE TABLE IF NOT EXISTS public.nfce_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT get_user_company_id(auth.uid()),
  branch_id uuid REFERENCES public.branches(id),
  nfce_id uuid NOT NULL REFERENCES public.nfce(id) ON DELETE CASCADE,
  number text NOT NULL,
  reason text NOT NULL,
  refund_method text NOT NULL DEFAULT 'cash',
  refund_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'authorized'
    CHECK (status IN ('draft','authorized','cancelled')),
  operator_id text,
  operator_name text,
  terminal_id text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfce_returns_nfce ON public.nfce_returns(nfce_id);
CREATE INDEX IF NOT EXISTS idx_nfce_returns_company ON public.nfce_returns(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfce_returns TO authenticated;
GRANT ALL ON public.nfce_returns TO service_role;
ALTER TABLE public.nfce_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nfce_returns_select" ON public.nfce_returns
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "nfce_returns_insert" ON public.nfce_returns
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "nfce_returns_update" ON public.nfce_returns
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "nfce_returns_delete" ON public.nfce_returns
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') AND company_id = get_user_company_id(auth.uid()));

-- 3) Itens de devolução
CREATE TABLE IF NOT EXISTS public.nfce_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT get_user_company_id(auth.uid()),
  return_id uuid NOT NULL REFERENCES public.nfce_returns(id) ON DELETE CASCADE,
  nfce_item_id uuid REFERENCES public.nfce_items(id) ON DELETE SET NULL,
  product_id uuid,
  product_code text,
  product_name text,
  quantity numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfce_return_items_return ON public.nfce_return_items(return_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfce_return_items TO authenticated;
GRANT ALL ON public.nfce_return_items TO service_role;
ALTER TABLE public.nfce_return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nfce_return_items_select" ON public.nfce_return_items
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "nfce_return_items_insert" ON public.nfce_return_items
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "nfce_return_items_update" ON public.nfce_return_items
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "nfce_return_items_delete" ON public.nfce_return_items
  FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- 4) Trigger updated_at para nfce_returns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_nfce_returns_updated_at ON public.nfce_returns;
CREATE TRIGGER update_nfce_returns_updated_at
  BEFORE UPDATE ON public.nfce_returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
