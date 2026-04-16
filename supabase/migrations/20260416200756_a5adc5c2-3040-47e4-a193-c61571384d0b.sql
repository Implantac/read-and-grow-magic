-- 1. order_stage_history: remove public read
DROP POLICY IF EXISTS "Anyone can view order_stage_history" ON public.order_stage_history;
CREATE POLICY "Authenticated can view order_stage_history"
ON public.order_stage_history FOR SELECT TO authenticated USING (true);

-- 2. wms_conference_items: remove public policies
DROP POLICY IF EXISTS "wms_conf_items_public_read" ON public.wms_conference_items;
DROP POLICY IF EXISTS "wms_conf_items_public_write" ON public.wms_conference_items;
CREATE POLICY "Authenticated can read wms_conference_items"
ON public.wms_conference_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert wms_conference_items"
ON public.wms_conference_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update wms_conference_items"
ON public.wms_conference_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete wms_conference_items"
ON public.wms_conference_items FOR DELETE TO authenticated USING (true);

-- 3. supplier_metrics: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view supplier_metrics" ON public.supplier_metrics;
CREATE POLICY "Authenticated can view supplier_metrics"
ON public.supplier_metrics FOR SELECT TO authenticated USING (true);

-- 4. nfe and nfe_items: restrict to authenticated only (drop any public/anon policies)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='nfe' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.nfe', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='nfe_items' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.nfe_items', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.nfe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read nfe" ON public.nfe FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert nfe" ON public.nfe FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update nfe" ON public.nfe FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete nfe" ON public.nfe FOR DELETE TO authenticated USING (true);

ALTER TABLE public.nfe_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read nfe_items" ON public.nfe_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert nfe_items" ON public.nfe_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update nfe_items" ON public.nfe_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete nfe_items" ON public.nfe_items FOR DELETE TO authenticated USING (true);

-- 5. realtime.messages: scope channel subscriptions
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='realtime' AND tablename='messages' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON realtime.messages', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated can read scoped realtime topics"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() LIKE 'public:%'
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('user:' || auth.uid()::text)
);

CREATE POLICY "Authenticated can publish scoped realtime topics"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'public:%'
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('user:' || auth.uid()::text)
);