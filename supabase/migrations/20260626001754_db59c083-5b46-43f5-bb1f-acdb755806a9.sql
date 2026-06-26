
-- Ciclo QA 03: Fluxos 08-10 (PCP / WMS / TMS) — enforce NOT NULL company_id e consolidar policies

-- 1) NOT NULL company_id em todas as tabelas PCP/WMS/TMS (todas com 0 linhas, seguro)
ALTER TABLE public.production_orders        ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.production_order_steps   ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.material_requirements    ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.material_consumptions    ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.warehouses               ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.warehouse_locations      ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.warehouse_zones          ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.stock_balances           ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.stock_movements          ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.stock_reservations       ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.wms_tasks                ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.wms_picking_orders       ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.wms_receiving_orders     ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.wms_shipments            ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.wms_storage_locations    ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.wms_movements            ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.carriers                 ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.vehicles                 ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.delivery_routes          ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.shipment_orders          ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.shipment_items           ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.distribution_centers     ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.loading_docks            ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.picking_tasks            ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.picking_waves            ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.putaway_tasks            ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.replenishment_tasks      ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.conference_records       ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.conference_record_items  ALTER COLUMN company_id SET NOT NULL;

-- stock_lots tem 8 linhas; só aplicar NOT NULL se não houver órfãos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.stock_lots WHERE company_id IS NULL) THEN
    ALTER TABLE public.stock_lots ALTER COLUMN company_id SET NOT NULL;
  END IF;
END $$;

-- 2) Consolidar policies duplicadas em stock_lots (6 policies redundantes)
DROP POLICY IF EXISTS stocklots_insert        ON public.stock_lots;
DROP POLICY IF EXISTS stocklots_select        ON public.stock_lots;
DROP POLICY IF EXISTS stocklots_update        ON public.stock_lots;
DROP POLICY IF EXISTS stocklots_delete        ON public.stock_lots;
DROP POLICY IF EXISTS stocklots_role_select   ON public.stock_lots;
DROP POLICY IF EXISTS stocklots_role_write    ON public.stock_lots;
DROP POLICY IF EXISTS stocklots_role_update   ON public.stock_lots;
DROP POLICY IF EXISTS stocklots_role_delete   ON public.stock_lots;

CREATE POLICY stocklots_select ON public.stock_lots
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY stocklots_insert ON public.stock_lots
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IS NOT NULL
    AND company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'operator'))
  );

CREATE POLICY stocklots_update ON public.stock_lots
  FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'operator')))
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY stocklots_delete ON public.stock_lots
  FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(),'admin'));
