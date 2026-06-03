
-- ---------- AI / Reports ----------
DROP POLICY IF EXISTS "Authenticated users can manage own chat" ON public.ai_executive_chat;
CREATE POLICY "ai_chat_tenant_select" ON public.ai_executive_chat
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND user_id = auth.uid());
CREATE POLICY "ai_chat_tenant_write" ON public.ai_executive_chat
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND user_id = auth.uid())
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view audit logs" ON public.ai_prompt_audit_logs;
CREATE POLICY "ai_prompt_audit_tenant_read" ON public.ai_prompt_audit_logs
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view reports" ON public.daily_executive_reports;
DROP POLICY IF EXISTS "System can insert reports" ON public.daily_executive_reports;
CREATE POLICY "daily_reports_tenant_read" ON public.daily_executive_reports
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- ---------- TMS / WMS ----------
DROP POLICY IF EXISTS "auth_carriers_all" ON public.carriers;
DROP POLICY IF EXISTS "auth_carriers_select" ON public.carriers;
CREATE POLICY "carriers_tenant_all" ON public.carriers
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "auth_vehicles_all" ON public.vehicles;
DROP POLICY IF EXISTS "auth_vehicles_select" ON public.vehicles;
CREATE POLICY "vehicles_tenant_all" ON public.vehicles
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Auth users can read wms_storage_locations" ON public.wms_storage_locations;
DROP POLICY IF EXISTS "Auth users can insert wms_storage_locations" ON public.wms_storage_locations;
DROP POLICY IF EXISTS "Auth users can update wms_storage_locations" ON public.wms_storage_locations;
DROP POLICY IF EXISTS "Auth users can delete wms_storage_locations" ON public.wms_storage_locations;
CREATE POLICY "wms_storage_locations_tenant_all" ON public.wms_storage_locations
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can manage conference_records" ON public.conference_records;
CREATE POLICY "conference_records_tenant_all" ON public.conference_records
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can manage conference_record_items" ON public.conference_record_items;
CREATE POLICY "conference_record_items_tenant_all" ON public.conference_record_items
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can manage inventory_sessions" ON public.inventory_sessions;
CREATE POLICY "inventory_sessions_tenant_all" ON public.inventory_sessions
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can manage checking_tasks" ON public.checking_tasks;
CREATE POLICY "checking_tasks_tenant_all" ON public.checking_tasks
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- ---------- Financial ----------
DROP POLICY IF EXISTS "Authenticated can manage financial_advances" ON public.financial_advances;
DROP POLICY IF EXISTS "Authenticated can view financial_advances" ON public.financial_advances;
CREATE POLICY "financial_advances_tenant_all" ON public.financial_advances
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "auth read checks" ON public.financial_checks;
DROP POLICY IF EXISTS "auth insert checks" ON public.financial_checks;
DROP POLICY IF EXISTS "auth update checks" ON public.financial_checks;
DROP POLICY IF EXISTS "auth delete checks" ON public.financial_checks;
CREATE POLICY "financial_checks_tenant_all" ON public.financial_checks
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "auth read charges log" ON public.financial_charges_log;
CREATE POLICY "financial_charges_log_tenant_read" ON public.financial_charges_log
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "auth read charges rules" ON public.financial_charges_rules;
CREATE POLICY "financial_charges_rules_tenant_read" ON public.financial_charges_rules
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "auth read default score" ON public.financial_default_score;
CREATE POLICY "financial_default_score_tenant_read" ON public.financial_default_score
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "fpa_read" ON public.financial_predictive_alerts;
CREATE POLICY "financial_predictive_alerts_tenant_read" ON public.financial_predictive_alerts
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can manage financial_categories" ON public.financial_categories;
DROP POLICY IF EXISTS "Authenticated can view financial_categories" ON public.financial_categories;
CREATE POLICY "financial_categories_tenant_all" ON public.financial_categories
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "auth read cat sugg" ON public.financial_category_suggestions;
DROP POLICY IF EXISTS "auth write cat sugg" ON public.financial_category_suggestions;
DROP POLICY IF EXISTS "auth update cat sugg" ON public.financial_category_suggestions;
CREATE POLICY "financial_category_suggestions_tenant_all" ON public.financial_category_suggestions
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- ---------- Accounting ----------
DROP POLICY IF EXISTS "Auth users can read chart_of_accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Auth users can insert chart_of_accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Auth users can update chart_of_accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Auth users can delete chart_of_accounts" ON public.chart_of_accounts;
CREATE POLICY "chart_of_accounts_tenant_all" ON public.chart_of_accounts
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Auth users can read journal_entry_lines" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "Auth users can insert journal_entry_lines" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "Auth users can update journal_entry_lines" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "Auth users can delete journal_entry_lines" ON public.journal_entry_lines;
CREATE POLICY "journal_entry_lines_tenant_all" ON public.journal_entry_lines
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- ---------- Catalog / Tax ----------
DROP POLICY IF EXISTS "Authenticated users can read categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;
CREATE POLICY "categories_tenant_all" ON public.categories
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Auth users manage cost_centers" ON public.cost_centers;
CREATE POLICY "cost_centers_tenant_all" ON public.cost_centers
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "difal_all" ON public.tax_difal_rules;
DROP POLICY IF EXISTS "difal_select" ON public.tax_difal_rules;
CREATE POLICY "tax_difal_rules_tenant_read" ON public.tax_difal_rules
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "tax_difal_rules_admin_write" ON public.tax_difal_rules
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "icms_st_all" ON public.tax_icms_st_rules;
DROP POLICY IF EXISTS "icms_st_select" ON public.tax_icms_st_rules;
CREATE POLICY "tax_icms_st_rules_tenant_read" ON public.tax_icms_st_rules
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "tax_icms_st_rules_admin_write" ON public.tax_icms_st_rules
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- Comms / Sales ----------
DROP POLICY IF EXISTS "Authenticated users can manage whatsapp_templates" ON public.whatsapp_templates;
CREATE POLICY "whatsapp_templates_tenant_all" ON public.whatsapp_templates
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can manage supplier_metrics" ON public.supplier_metrics;
DROP POLICY IF EXISTS "Authenticated can view supplier_metrics" ON public.supplier_metrics;
CREATE POLICY "supplier_metrics_tenant_all" ON public.supplier_metrics
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can manage lead_nurturing_sequences" ON public.lead_nurturing_sequences;
CREATE POLICY "lead_nurturing_sequences_tenant_all" ON public.lead_nurturing_sequences
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can manage lead_nurturing_enrollments" ON public.lead_nurturing_enrollments;
CREATE POLICY "lead_nurturing_enrollments_tenant_all" ON public.lead_nurturing_enrollments
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can read playbooks" ON public.sales_playbooks;
CREATE POLICY "sales_playbooks_tenant_read" ON public.sales_playbooks
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can read objections" ON public.sales_objections;
CREATE POLICY "sales_objections_tenant_read" ON public.sales_objections
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- ---------- Order history ----------
DROP POLICY IF EXISTS "Authenticated users can read order_status_history" ON public.order_status_history;
DROP POLICY IF EXISTS "Authenticated users can insert order_status_history" ON public.order_status_history;
CREATE POLICY "order_status_history_tenant_read" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "order_status_history_tenant_insert" ON public.order_status_history
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can view order_stage_history" ON public.order_stage_history;
DROP POLICY IF EXISTS "Authenticated can insert order_stage_history" ON public.order_stage_history;
CREATE POLICY "order_stage_history_tenant_read" ON public.order_stage_history
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "order_stage_history_tenant_insert" ON public.order_stage_history
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- ---------- Kanban (was public) ----------
DROP POLICY IF EXISTS "Anyone can view kanban_limits" ON public.kanban_limits;
DROP POLICY IF EXISTS "Authenticated can manage kanban_limits" ON public.kanban_limits;
CREATE POLICY "kanban_limits_tenant_all" ON public.kanban_limits
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- =====================================================================
-- Revoke EXECUTE on sensitive SECURITY DEFINER (cron/maintenance only).
-- =====================================================================
REVOKE EXECUTE ON FUNCTION public.backfill_default_lots() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.validate_lot_stock_consistency() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.recompute_default_scores() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.detect_cashflow_risks() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.detect_financial_alerts() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.generate_recurring_entries() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.process_charges_ruler() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.run_financial_audit(text) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_financial_health_score() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.recalc_bank_balance(uuid) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.resolve_accounting_pair(text, uuid, uuid, uuid) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.evaluate_transaction_risk(numeric, text, uuid, text, text) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.update_entity_risk_profile(text, uuid, text, numeric, boolean) FROM authenticated, anon;
