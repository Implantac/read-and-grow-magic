
-- Disable user triggers during this migration so backfill updates don't fire
-- generic timestamp triggers on tables without updated_at columns.
SET LOCAL session_replication_role = replica;

DO $$
DECLARE v_company uuid;
BEGIN
  SELECT id INTO v_company FROM public.companies ORDER BY created_at NULLS LAST LIMIT 1;
  IF v_company IS NULL THEN
    INSERT INTO public.companies (id, name) VALUES (gen_random_uuid(), 'Empresa Padrão') RETURNING id INTO v_company;
  END IF;
  PERFORM set_config('app.default_company', v_company::text, false);
END $$;

-- 1) Add company_id column where missing + backfill + default + index.
DO $$
DECLARE
  t text;
  v_company uuid := current_setting('app.default_company')::uuid;
  tables text[] := ARRAY[
    'ai_brain_memory','ai_brain_decisions','ai_brain_runs',
    'ai_sales_insights','ai_sales_scores','ai_recommendations','ai_daily_actions',
    'ai_opportunity_predictions','ai_forecast_snapshots','ai_executive_alerts',
    'ai_executive_insights','ai_executive_scenarios','ai_kpis','ai_learning',
    'ai_production_insights','ai_executive_chat','ai_action_logs','ai_prompt_audit_logs',
    'client_timeline','customer_credit_profiles','collection_actions',
    'renegotiations','renegotiation_items','credit_policies',
    'commissions','commission_payments','commission_policies','commission_rules',
    'bank_accounts','bank_transactions','bank_transfers',
    'financial_settlements','financial_advance_transactions','financial_offsets',
    'financial_payment_split','payment_records','financial_recurring',
    'cash_flow_entries','financial_health_scores','financial_alerts',
    'financial_audit_logs','financial_category_suggestions','financial_charges_log',
    'financial_charges_rules','financial_default_score','financial_fraud_rules',
    'financial_operations_log','financial_predictive_alerts','financial_risk_profiles',
    'financial_security_logs',
    'nfe','nfe_items','nfce','nfce_items','cte','cte_nfe_links','mdfe','mdfe_documents',
    'sped_files','fiscal_reports','tax_rules','tax_difal_rules','tax_icms_st_rules',
    'order_approvals','order_blocks','order_items','order_status_history','order_stage_history',
    'sale_items','sales','sales_reps','sales_targets','sales_forecasts','sales_daily_goals',
    'seller_daily_targets','sales_funnel','sales_campaigns','sales_contact_logs',
    'sales_objections','sales_playbooks','commercial_alerts',
    'deleted_orders_archive','billing_queue','follow_up_tasks','playbook_usage_logs',
    'lead_nurturing_enrollments','lead_nurturing_sequences',
    'wms_picking_orders','wms_picking_items','wms_packing_orders','wms_receiving_orders',
    'wms_receiving_items','wms_shipments','wms_movements','wms_inventory_items',
    'wms_inventory_movements','wms_inventory_counts','wms_conference_records',
    'wms_conference_items','wms_returns','wms_logs','wms_tasks','wms_task_logs',
    'wms_audit_log','wms_ai_insights','wms_storage_locations',
    'warehouse_locations','warehouse_zones','warehouses','distribution_centers',
    'stock_balances','stock_reservations','stock_lots','stock_movements',
    'picking_tasks','picking_waves','putaway_tasks','replenishment_tasks',
    'conference_records','conference_record_items','checking_tasks',
    'inventory_sessions','lot_migration_audit',
    'suppliers','supplier_metrics','purchase_orders','purchase_order_items',
    'quotations','quotation_items',
    'production_capacity','production_costs','production_routes','production_route_steps',
    'production_steps','production_resources','production_sectors','production_lines',
    'production_schedule','production_indicators','production_time_logs',
    'material_consumptions','material_requirements','product_materials','product_costs',
    'product_technical_sheets','supply_stock','supply_movements','work_centers',
    'kanban_limits',
    'products','categories',
    'delivery_routes','delivery_proof','shipment_orders','shipment_items','loading_docks',
    'carriers','vehicles',
    'gamification_points','gamification_badge_awards','gamification_mission_progress',
    'gamification_challenge_participants','gamification_badges','gamification_missions',
    'gamification_challenges',
    'rfid_readers','rfid_tags','rfid_wms_rules',
    'open_finance_connections','pix_charges','pix_webhook_events',
    'accounting_periods','journal_entries','journal_entry_lines','chart_of_accounts',
    'cost_centers',
    'daily_executive_reports','cross_module_events','notifications','whatsapp_templates',
    'system_parameters','feature_flags'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS company_id uuid', t);
      EXECUTE format('UPDATE public.%I SET company_id = %L WHERE company_id IS NULL', t, v_company);
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN company_id SET DEFAULT public.get_user_company_id(auth.uid())', t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(company_id)', 'idx_'||t||'_company_id', t);
    END IF;
  END LOOP;
END $$;

-- 2) Replace policies with strict company-scoped ALL policy.
DO $$
DECLARE
  t text;
  p record;
  tables text[] := ARRAY[
    'ai_brain_decisions','ai_brain_runs',
    'ai_sales_insights','ai_sales_scores','ai_recommendations','ai_daily_actions',
    'ai_opportunity_predictions','ai_forecast_snapshots','ai_executive_alerts',
    'ai_executive_insights','ai_executive_scenarios','ai_kpis','ai_learning',
    'ai_production_insights',
    'client_timeline','customer_credit_profiles','collection_actions',
    'renegotiations','renegotiation_items',
    'commissions','commission_payments','commission_policies','commission_rules',
    'bank_accounts','bank_transactions','bank_transfers',
    'financial_settlements','financial_advance_transactions','financial_offsets',
    'financial_payment_split','payment_records','financial_recurring',
    'cash_flow_entries','financial_health_scores',
    'nfe_items','nfce_items','cte','cte_nfe_links','mdfe','mdfe_documents','sped_files',
    'order_approvals','order_blocks',
    'sales_reps','suppliers',
    'accounting_periods',
    'follow_up_tasks','sales_contact_logs','sales_forecasts','sales_daily_goals',
    'seller_daily_targets','sales_funnel','sales_targets','commercial_alerts','sales_campaigns',
    'billing_queue','deleted_orders_archive',
    'delivery_routes','delivery_proof','shipment_orders','shipment_items','loading_docks',
    'distribution_centers','warehouses',
    'gamification_points','gamification_badge_awards','gamification_mission_progress',
    'gamification_challenge_participants','gamification_badges','gamification_missions',
    'gamification_challenges',
    'open_finance_connections',
    'production_capacity','production_costs','production_routes','production_route_steps',
    'production_steps','production_resources','production_sectors','production_lines',
    'production_schedule','production_indicators','production_time_logs',
    'material_consumptions','material_requirements','product_materials','product_costs',
    'product_technical_sheets','supply_stock','supply_movements','work_centers',
    'products',
    'purchase_orders','purchase_order_items','quotation_items',
    'rfid_readers','rfid_tags','rfid_wms_rules',
    'wms_picking_orders','wms_picking_items','wms_packing_orders','wms_receiving_orders',
    'wms_receiving_items','wms_shipments','wms_movements','wms_inventory_items',
    'wms_inventory_movements','wms_inventory_counts','wms_conference_records',
    'wms_conference_items','wms_returns','wms_logs','wms_tasks','wms_task_logs',
    'wms_audit_log','wms_ai_insights',
    'warehouse_locations','warehouse_zones','stock_balances','stock_reservations',
    'picking_tasks','picking_waves','putaway_tasks','replenishment_tasks',
    'follow_ups','production_logs','production_order_steps','production_events',
    'production_machines','outsourcing_orders','industrial_alerts','sales_opportunities',
    'time_entries','production_orders','iot_telemetry'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      FOR p IN SELECT polname FROM pg_policy WHERE polrelid = format('public.%I', t)::regclass LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.polname, t);
      END LOOP;
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format($f$CREATE POLICY %I ON public.%I AS PERMISSIVE FOR ALL TO authenticated USING (company_id = public.get_user_company_id(auth.uid())) WITH CHECK (company_id = public.get_user_company_id(auth.uid()))$f$,
        t||'_tenant_isolation', t);
    END IF;
  END LOOP;
END $$;

-- 3) AI brain memory scope-aware policy
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.ai_brain_memory'::regclass LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ai_brain_memory', p.polname);
  END LOOP;
END $$;
ALTER TABLE public.ai_brain_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_brain_memory_select" ON public.ai_brain_memory
  FOR SELECT TO authenticated
  USING (
    scope = 'global'
    OR (scope = 'user' AND user_id = auth.uid())
    OR (scope = 'company' AND company_id = public.get_user_company_id(auth.uid()))
  );
CREATE POLICY "ai_brain_memory_insert" ON public.ai_brain_memory
  FOR INSERT TO authenticated
  WITH CHECK (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope = 'company' AND company_id = public.get_user_company_id(auth.uid())
        AND public.has_role(auth.uid(),'admin'))
    OR (scope = 'global' AND public.has_role(auth.uid(),'admin'))
  );
CREATE POLICY "ai_brain_memory_update" ON public.ai_brain_memory
  FOR UPDATE TO authenticated
  USING (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope IN ('company','global') AND public.has_role(auth.uid(),'admin')
        AND (scope = 'global' OR company_id = public.get_user_company_id(auth.uid())))
  );
CREATE POLICY "ai_brain_memory_delete" ON public.ai_brain_memory
  FOR DELETE TO authenticated
  USING (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope IN ('company','global') AND public.has_role(auth.uid(),'admin')
        AND (scope = 'global' OR company_id = public.get_user_company_id(auth.uid())))
  );

-- 4) Financial audit logs: service role only for writes.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.financial_audit_logs'::regclass LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.financial_audit_logs', p.polname);
  END LOOP;
END $$;
ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financial_audit_logs_admin_select" ON public.financial_audit_logs
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    AND company_id = public.get_user_company_id(auth.uid())
  );
