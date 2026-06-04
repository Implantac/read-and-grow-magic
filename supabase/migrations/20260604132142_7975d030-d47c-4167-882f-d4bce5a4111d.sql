
-- Helper: get current user's company
-- (assumes public.get_user_company_id(uuid) and public.has_role(uuid, app_role) already exist)

-- ============ cross_module_events ============
DROP POLICY IF EXISTS cme_role_select ON public.cross_module_events;
DROP POLICY IF EXISTS cme_role_insert ON public.cross_module_events;
CREATE POLICY cme_role_select ON public.cross_module_events FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY cme_role_insert ON public.cross_module_events FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- ============ financial_alerts ============
DROP POLICY IF EXISTS "admin manage fin alerts" ON public.financial_alerts;
CREATE POLICY "admin manage fin alerts" ON public.financial_alerts FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- ============ financial_charges_log ============
DROP POLICY IF EXISTS "admin manage charges log" ON public.financial_charges_log;
CREATE POLICY "admin manage charges log" ON public.financial_charges_log FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- ============ financial_default_score ============
DROP POLICY IF EXISTS "admin manage default score" ON public.financial_default_score;
CREATE POLICY "admin manage default score" ON public.financial_default_score FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- ============ financial_fraud_rules ============
DROP POLICY IF EXISTS "admins manage fraud rules" ON public.financial_fraud_rules;
CREATE POLICY "admins manage fraud rules" ON public.financial_fraud_rules FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- ============ financial_risk_profiles ============
DROP POLICY IF EXISTS "admins read risk profiles" ON public.financial_risk_profiles;
CREATE POLICY "admins read risk profiles" ON public.financial_risk_profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- ============ financial_security_logs ============
DROP POLICY IF EXISTS "admins read security logs" ON public.financial_security_logs;
CREATE POLICY "admins read security logs" ON public.financial_security_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- ============ fiscal_reports ============
DROP POLICY IF EXISTS fr_role_select ON public.fiscal_reports;
DROP POLICY IF EXISTS fr_role_write ON public.fiscal_reports;
DROP POLICY IF EXISTS fr_role_update ON public.fiscal_reports;
DROP POLICY IF EXISTS fr_role_delete ON public.fiscal_reports;
CREATE POLICY fr_role_select ON public.fiscal_reports FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'viewer'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY fr_role_write ON public.fiscal_reports FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY fr_role_update ON public.fiscal_reports FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY fr_role_delete ON public.fiscal_reports FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'::app_role));

-- ============ journal_entries ============
DROP POLICY IF EXISTS je_role_select ON public.journal_entries;
DROP POLICY IF EXISTS je_role_write ON public.journal_entries;
DROP POLICY IF EXISTS je_role_update ON public.journal_entries;
DROP POLICY IF EXISTS je_role_delete ON public.journal_entries;
CREATE POLICY je_role_select ON public.journal_entries FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'viewer'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY je_role_write ON public.journal_entries FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY je_role_update ON public.journal_entries FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY je_role_delete ON public.journal_entries FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'::app_role));

-- ============ nfce ============
DROP POLICY IF EXISTS nfce_role_select ON public.nfce;
DROP POLICY IF EXISTS nfce_role_write ON public.nfce;
DROP POLICY IF EXISTS nfce_role_update ON public.nfce;
DROP POLICY IF EXISTS nfce_role_delete ON public.nfce;
CREATE POLICY nfce_role_select ON public.nfce FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'viewer'::app_role) OR public.has_role(auth.uid(),'operator'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY nfce_role_write ON public.nfce FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'operator'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY nfce_role_update ON public.nfce FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY nfce_role_delete ON public.nfce FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'::app_role));

-- ============ nfe ============
DROP POLICY IF EXISTS nfe_role_select ON public.nfe;
DROP POLICY IF EXISTS nfe_role_write ON public.nfe;
DROP POLICY IF EXISTS nfe_role_update ON public.nfe;
DROP POLICY IF EXISTS nfe_role_delete ON public.nfe;
CREATE POLICY nfe_role_select ON public.nfe FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'viewer'::app_role) OR public.has_role(auth.uid(),'operator'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY nfe_role_write ON public.nfe FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'operator'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY nfe_role_update ON public.nfe FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY nfe_role_delete ON public.nfe FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'::app_role));

-- ============ pix_charges ============
DROP POLICY IF EXISTS pix_charges_select ON public.pix_charges;
DROP POLICY IF EXISTS pix_charges_insert ON public.pix_charges;
DROP POLICY IF EXISTS pix_charges_update ON public.pix_charges;
DROP POLICY IF EXISTS pix_charges_delete ON public.pix_charges;
CREATE POLICY pix_charges_select ON public.pix_charges FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'operator'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY pix_charges_insert ON public.pix_charges FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'operator'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY pix_charges_update ON public.pix_charges FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY pix_charges_delete ON public.pix_charges FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'::app_role));

-- ============ sales_objections ============
DROP POLICY IF EXISTS "Admins can manage objections" ON public.sales_objections;
CREATE POLICY "Admins can manage objections" ON public.sales_objections FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- ============ stock_lots ============
DROP POLICY IF EXISTS stocklots_role_select ON public.stock_lots;
DROP POLICY IF EXISTS stocklots_role_write ON public.stock_lots;
DROP POLICY IF EXISTS stocklots_role_update ON public.stock_lots;
DROP POLICY IF EXISTS stocklots_role_delete ON public.stock_lots;
CREATE POLICY stocklots_role_select ON public.stock_lots FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'viewer'::app_role) OR public.has_role(auth.uid(),'operator'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY stocklots_role_write ON public.stock_lots FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'operator'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY stocklots_role_update ON public.stock_lots FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'operator'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY stocklots_role_delete ON public.stock_lots FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'::app_role));

-- ============ stock_movements ============
DROP POLICY IF EXISTS stockmov_role_select ON public.stock_movements;
DROP POLICY IF EXISTS stockmov_role_write ON public.stock_movements;
DROP POLICY IF EXISTS stockmov_role_update ON public.stock_movements;
DROP POLICY IF EXISTS stockmov_role_delete ON public.stock_movements;
CREATE POLICY stockmov_role_select ON public.stock_movements FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'viewer'::app_role) OR public.has_role(auth.uid(),'operator'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY stockmov_role_write ON public.stock_movements FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'operator'::app_role) OR public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
CREATE POLICY stockmov_role_update ON public.stock_movements FOR UPDATE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'manager'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY stockmov_role_delete ON public.stock_movements FOR DELETE TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'::app_role));

-- ============ user_roles ============
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can view roles in company" ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admins can insert roles in company" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admins can update roles in company" ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admins can delete roles in company" ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- ============ playbook_usage_logs ============
DROP POLICY IF EXISTS "Anyone can view usage logs" ON public.playbook_usage_logs;
DROP POLICY IF EXISTS "Anyone can insert usage logs" ON public.playbook_usage_logs;
DROP POLICY IF EXISTS playbook_usage_logs_select ON public.playbook_usage_logs;
DROP POLICY IF EXISTS playbook_usage_logs_insert ON public.playbook_usage_logs;
CREATE POLICY playbook_usage_logs_select ON public.playbook_usage_logs FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY playbook_usage_logs_insert ON public.playbook_usage_logs FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- ============ ai_action_logs ============
DROP POLICY IF EXISTS "Users can view own action logs" ON public.ai_action_logs;
CREATE POLICY "Users can view own action logs" ON public.ai_action_logs FOR SELECT TO authenticated
USING (user_id = auth.uid() AND company_id = public.get_user_company_id(auth.uid()));

-- ============ feature_flags ============
DROP POLICY IF EXISTS feature_flags_tenant_read ON public.feature_flags;
CREATE POLICY feature_flags_tenant_read ON public.feature_flags FOR SELECT TO authenticated
USING (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()));

-- ============ financial_operations_log ============
DROP POLICY IF EXISTS "auth read ops" ON public.financial_operations_log;
DROP POLICY IF EXISTS "auth insert ops" ON public.financial_operations_log;
CREATE POLICY "auth read ops" ON public.financial_operations_log FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "auth insert ops" ON public.financial_operations_log FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- ============ lot_migration_audit ============
DROP POLICY IF EXISTS lot_audit_read_admin ON public.lot_migration_audit;
CREATE POLICY lot_audit_read_admin ON public.lot_migration_audit FOR SELECT TO authenticated
USING ((public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'manager'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
