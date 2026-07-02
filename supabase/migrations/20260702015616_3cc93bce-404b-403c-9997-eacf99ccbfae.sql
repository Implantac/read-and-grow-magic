
-- SPRINT A — PRODUTOS UNIVERSAL
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS item_kind text NOT NULL DEFAULT 'resale'
    CHECK (item_kind IN ('service','resale','manufactured')),
  ADD COLUMN IF NOT EXISTS requires_lot_tracking boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS iss_code text,
  ADD COLUMN IF NOT EXISTS nbs_code text,
  ADD COLUMN IF NOT EXISTS multi_ean jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bom_ready boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.sync_product_bom_ready()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_product_id uuid; v_has_bom boolean;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);
  SELECT EXISTS(SELECT 1 FROM public.product_materials WHERE product_id = v_product_id) INTO v_has_bom;
  UPDATE public.products SET bom_ready = v_has_bom WHERE id = v_product_id;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_sync_product_bom_ready ON public.product_materials;
CREATE TRIGGER trg_sync_product_bom_ready
AFTER INSERT OR DELETE OR UPDATE ON public.product_materials
FOR EACH ROW EXECUTE FUNCTION public.sync_product_bom_ready();

-- SPRINT C
CREATE TABLE IF NOT EXISTS public.price_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('wholesale','retail','custom')),
  discount_pct numeric(6,3) NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_lists TO authenticated;
GRANT ALL ON public.price_lists TO service_role;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_lists_tenant_select" ON public.price_lists
  FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "price_lists_tenant_write" ON public.price_lists
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)));

CREATE TRIGGER trg_price_lists_updated_at
BEFORE UPDATE ON public.price_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.price_lists (company_id, name, kind, discount_pct, is_default)
SELECT c.id, 'Atacado Padrão', 'wholesale', 0, true FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.price_lists p WHERE p.company_id = c.id AND p.kind='wholesale');

INSERT INTO public.price_lists (company_id, name, kind, discount_pct, is_default)
SELECT c.id, 'Varejo Padrão', 'retail', 0, true FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.price_lists p WHERE p.company_id = c.id AND p.kind='retail');

DROP MATERIALIZED VIEW IF EXISTS public.client_commercial_profiles;
CREATE MATERIALIZED VIEW public.client_commercial_profiles AS
SELECT
  c.id AS client_id,
  c.company_id,
  c.person_type,
  CASE
    WHEN COALESCE(SUM(o.total),0) > 500000 THEN 'diamond'
    WHEN COALESCE(SUM(o.total),0) > 100000 THEN 'gold'
    WHEN COALESCE(SUM(o.total),0) > 20000  THEN 'silver'
    ELSE 'bronze'
  END AS tier,
  MAX(o.created_at) AS last_purchase_at,
  COALESCE(SUM(o.total) FILTER (WHERE o.created_at > now() - interval '12 months'),0) AS ltv_12m,
  COUNT(o.id) AS order_count,
  now() AS refreshed_at
FROM public.clients c
LEFT JOIN public.orders o ON o.client_id = c.id AND o.status NOT IN ('cancelled','draft')
GROUP BY c.id, c.company_id, c.person_type;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ccp_client ON public.client_commercial_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_ccp_company ON public.client_commercial_profiles(company_id);
GRANT SELECT ON public.client_commercial_profiles TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_client_commercial_profile(_client_id uuid)
RETURNS TABLE (
  client_id uuid, tier text, last_purchase_at timestamptz, ltv_12m numeric,
  order_count bigint, suggested_price_list_id uuid, suggested_price_list_name text,
  suggested_payment_terms text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid := get_user_company_id(auth.uid()); v_person text;
BEGIN
  SELECT c.person_type INTO v_person FROM public.clients c
    WHERE c.id = _client_id AND c.company_id = v_company;
  IF v_person IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT p.client_id, p.tier, p.last_purchase_at, p.ltv_12m, p.order_count,
    pl.id, pl.name,
    CASE WHEN v_person = 'pj' THEN '30/60' ELSE 'à vista' END
  FROM public.client_commercial_profiles p
  LEFT JOIN public.price_lists pl
    ON pl.company_id = v_company AND pl.active = true AND pl.is_default = true
    AND pl.kind = CASE WHEN v_person = 'pj' THEN 'wholesale' ELSE 'retail' END
  WHERE p.client_id = _client_id AND p.company_id = v_company;
END; $$;

REVOKE EXECUTE ON FUNCTION public.get_client_commercial_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_client_commercial_profile(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.refresh_client_commercial_profiles()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY public.client_commercial_profiles; END; $$;

REVOKE EXECUTE ON FUNCTION public.refresh_client_commercial_profiles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_client_commercial_profiles() TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='refresh_client_commercial_profiles') THEN
      PERFORM cron.unschedule('refresh_client_commercial_profiles');
    END IF;
    PERFORM cron.schedule('refresh_client_commercial_profiles','0 3 * * *',
      $refresh$SELECT public.refresh_client_commercial_profiles();$refresh$);
  END IF;
END $$;
