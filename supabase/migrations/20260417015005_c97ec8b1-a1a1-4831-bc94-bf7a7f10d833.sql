
-- ============================================================
-- Tenant isolation for clients, quotations, and realtime tables
-- ============================================================

-- Helper: add company_id + auto-fill trigger + tenant RLS to a table
-- Done inline per-table for clarity.

-- ---------- 1) CLIENTS ----------
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_id uuid;
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);

DROP TRIGGER IF EXISTS trg_clients_set_company_id ON public.clients;
CREATE TRIGGER trg_clients_set_company_id
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='clients'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.clients', pol.policyname); END LOOP;
END $$;

CREATE POLICY "clients_tenant_select" ON public.clients FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    OR (company_id IS NULL AND public.has_role(auth.uid(),'admin'))
  );

CREATE POLICY "clients_tenant_insert" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'))
    AND (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()))
  );

CREATE POLICY "clients_tenant_update" ON public.clients FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid())
         AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator')))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "clients_tenant_delete" ON public.clients FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

-- ---------- 2) QUOTATIONS ----------
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS company_id uuid;
CREATE INDEX IF NOT EXISTS idx_quotations_company_id ON public.quotations(company_id);

DROP TRIGGER IF EXISTS trg_quotations_set_company_id ON public.quotations;
CREATE TRIGGER trg_quotations_set_company_id
  BEFORE INSERT ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='quotations'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.quotations', pol.policyname); END LOOP;
END $$;

CREATE POLICY "quotations_tenant_select" ON public.quotations FOR SELECT TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    OR (company_id IS NULL AND public.has_role(auth.uid(),'admin'))
  );

CREATE POLICY "quotations_tenant_insert" ON public.quotations FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'))
    AND (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()))
  );

CREATE POLICY "quotations_tenant_update" ON public.quotations FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "quotations_tenant_delete" ON public.quotations FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

-- ---------- 3) REALTIME-BROADCAST TABLES ----------
-- Apply tenant scoping to SELECT only (so realtime broadcasts respect company).
-- Mutation policies left intact unless they were USING true broad policies.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'production_orders','time_entries','rfid_events','delivery_tracking',
    'sales_opportunities','follow_ups','industrial_alerts','production_order_steps',
    'production_logs','production_machines','production_events','iot_telemetry',
    'outsourcing_orders'
  ];
  pol record;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Skip if table doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      CONTINUE;
    END IF;

    -- Add company_id if missing
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS company_id uuid', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_company_id ON public.%I(company_id)', t, t);

    -- Auto-fill trigger
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_set_company_id ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_set_company_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user()', t, t);

    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Drop existing SELECT policies (broad ones)
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND cmd='SELECT'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    -- Tenant-scoped SELECT
    EXECUTE format($f$
      CREATE POLICY "%s_tenant_select" ON public.%I FOR SELECT TO authenticated
      USING (
        company_id = public.get_user_company_id(auth.uid())
        OR (company_id IS NULL AND public.has_role(auth.uid(),'admin'))
      )
    $f$, t, t);
  END LOOP;
END $$;
