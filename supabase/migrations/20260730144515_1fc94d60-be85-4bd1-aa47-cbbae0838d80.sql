ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS external_customer_id text,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_payment_at timestamptz;

CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  billing_cycle text NOT NULL DEFAULT 'monthly',
  amount numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'manual',
  external_invoice_id text,
  external_customer_id text,
  checkout_url text,
  due_date date,
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscription_invoices TO authenticated;
GRANT ALL ON public.subscription_invoices TO service_role;

ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members view own invoices" ON public.subscription_invoices;
CREATE POLICY "Company members view own invoices"
  ON public.subscription_invoices FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_company ON public.subscription_invoices(company_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_invoices_external
  ON public.subscription_invoices(provider, external_invoice_id)
  WHERE external_invoice_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_subscription_invoices_updated_at ON public.subscription_invoices;
CREATE TRIGGER trg_subscription_invoices_updated_at
  BEFORE UPDATE ON public.subscription_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assinaturas: escrita apenas via servidor (webhook de pagamento).
DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.subscriptions;

DROP POLICY IF EXISTS "Admins request cancellation" ON public.subscriptions;
CREATE POLICY "Admins request cancellation"
  ON public.subscriptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()));

REVOKE INSERT, DELETE ON public.subscriptions FROM authenticated;
GRANT SELECT, UPDATE (cancel_at_period_end) ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;