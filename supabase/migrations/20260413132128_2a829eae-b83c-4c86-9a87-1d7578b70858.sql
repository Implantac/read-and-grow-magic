
-- Add company_id to profiles for multi-tenant isolation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create a security definer function to get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- 1. Fix wms_logs: remove public policies, add authenticated-only
DROP POLICY IF EXISTS "wms_logs_public_read" ON public.wms_logs;
DROP POLICY IF EXISTS "wms_logs_public_write" ON public.wms_logs;
CREATE POLICY "Auth users can read wms_logs" ON public.wms_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert wms_logs" ON public.wms_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update wms_logs" ON public.wms_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete wms_logs" ON public.wms_logs FOR DELETE TO authenticated USING (true);

-- 2. Fix production_machines: replace public SELECT with authenticated
DROP POLICY IF EXISTS "Anyone can view machines" ON public.production_machines;
CREATE POLICY "Auth users can read machines" ON public.production_machines FOR SELECT TO authenticated USING (true);

-- 3. Fix subscriptions: scope to user's company
DROP POLICY IF EXISTS "Company members view subscription" ON public.subscriptions;
CREATE POLICY "Company members view own subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 4. Fix saas_invoices: scope to user's company
DROP POLICY IF EXISTS "Company members view invoices" ON public.saas_invoices;
CREATE POLICY "Company members view own invoices" ON public.saas_invoices FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 5. Fix usage_tracking: scope to user's company
DROP POLICY IF EXISTS "Company members view usage" ON public.usage_tracking;
CREATE POLICY "Company members view own usage" ON public.usage_tracking FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 6. Fix notifications: remove user_id IS NULL from UPDATE and DELETE
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());
