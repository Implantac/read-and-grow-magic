
-- 1. user_roles: adicionar company_id e escopar
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS company_id UUID;
UPDATE public.user_roles ur SET company_id = p.company_id FROM public.profiles p WHERE p.id = ur.user_id AND ur.company_id IS NULL;

DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins read roles in their company" ON public.user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admins insert roles in their company" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admins update roles in their company" ON public.user_roles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admins delete roles in their company" ON public.user_roles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- 2. playbook_usage_logs
DROP POLICY IF EXISTS "Authenticated users can read usage logs" ON public.playbook_usage_logs;
DROP POLICY IF EXISTS "Authenticated users can insert usage logs" ON public.playbook_usage_logs;
CREATE POLICY "Read playbook logs by company" ON public.playbook_usage_logs FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Insert playbook logs by company" ON public.playbook_usage_logs FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- 3. financial_operations_log
DROP POLICY IF EXISTS "auth read ops" ON public.financial_operations_log;
DROP POLICY IF EXISTS "auth ins ops" ON public.financial_operations_log;
CREATE POLICY "Read fin ops by company" ON public.financial_operations_log FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Insert fin ops by company" ON public.financial_operations_log FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- 4. financial_risk_profiles
DROP POLICY IF EXISTS "admins read risk profiles" ON public.financial_risk_profiles;
CREATE POLICY "admins read risk profiles by company" ON public.financial_risk_profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- 5. financial_security_logs
DROP POLICY IF EXISTS "admins read security logs" ON public.financial_security_logs;
DROP POLICY IF EXISTS "admins update security logs" ON public.financial_security_logs;
CREATE POLICY "admins read sec logs by company" ON public.financial_security_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "admins update sec logs by company" ON public.financial_security_logs FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- 6. fiscal_reports
DROP POLICY IF EXISTS "fiscal_reports_role_select" ON public.fiscal_reports;
DROP POLICY IF EXISTS "fiscal_reports_role_write" ON public.fiscal_reports;
DROP POLICY IF EXISTS "fiscal_reports_role_update" ON public.fiscal_reports;
DROP POLICY IF EXISTS "fiscal_reports_role_delete" ON public.fiscal_reports;
CREATE POLICY "fiscal_reports_select" ON public.fiscal_reports FOR SELECT TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'viewer'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "fiscal_reports_insert" ON public.fiscal_reports FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "fiscal_reports_update" ON public.fiscal_reports FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "fiscal_reports_delete" ON public.fiscal_reports FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- 7. journal_entries
DROP POLICY IF EXISTS "je_role_select" ON public.journal_entries;
DROP POLICY IF EXISTS "je_role_write" ON public.journal_entries;
DROP POLICY IF EXISTS "je_role_update" ON public.journal_entries;
DROP POLICY IF EXISTS "je_role_delete" ON public.journal_entries;
CREATE POLICY "je_select" ON public.journal_entries FOR SELECT TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'viewer'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "je_insert" ON public.journal_entries FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "je_update" ON public.journal_entries FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "je_delete" ON public.journal_entries FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- 8. nfe
DROP POLICY IF EXISTS "nfe_role_select" ON public.nfe;
DROP POLICY IF EXISTS "nfe_role_write" ON public.nfe;
DROP POLICY IF EXISTS "nfe_role_update" ON public.nfe;
DROP POLICY IF EXISTS "nfe_role_delete" ON public.nfe;
CREATE POLICY "nfe_select" ON public.nfe FOR SELECT TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role) OR has_role(auth.uid(),'viewer'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "nfe_insert" ON public.nfe FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "nfe_update" ON public.nfe FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "nfe_delete" ON public.nfe FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- 9. nfce
DROP POLICY IF EXISTS "nfce_role_select" ON public.nfce;
DROP POLICY IF EXISTS "nfce_role_write" ON public.nfce;
DROP POLICY IF EXISTS "nfce_role_update" ON public.nfce;
DROP POLICY IF EXISTS "nfce_role_delete" ON public.nfce;
CREATE POLICY "nfce_select" ON public.nfce FOR SELECT TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role) OR has_role(auth.uid(),'viewer'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "nfce_insert" ON public.nfce FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "nfce_update" ON public.nfce FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "nfce_delete" ON public.nfce FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- 10. pix_charges
DROP POLICY IF EXISTS "pix_charges_select" ON public.pix_charges;
DROP POLICY IF EXISTS "pix_charges_insert" ON public.pix_charges;
DROP POLICY IF EXISTS "pix_charges_update" ON public.pix_charges;
DROP POLICY IF EXISTS "pix_charges_delete" ON public.pix_charges;
CREATE POLICY "pix_select" ON public.pix_charges FOR SELECT TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "pix_insert" ON public.pix_charges FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "pix_update" ON public.pix_charges FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "pix_delete" ON public.pix_charges FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- 11. stock_lots
DROP POLICY IF EXISTS "stocklots_role_select" ON public.stock_lots;
DROP POLICY IF EXISTS "stocklots_role_write" ON public.stock_lots;
DROP POLICY IF EXISTS "stocklots_role_update" ON public.stock_lots;
DROP POLICY IF EXISTS "stocklots_role_delete" ON public.stock_lots;
CREATE POLICY "stocklots_select" ON public.stock_lots FOR SELECT TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role) OR has_role(auth.uid(),'viewer'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "stocklots_insert" ON public.stock_lots FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "stocklots_update" ON public.stock_lots FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "stocklots_delete" ON public.stock_lots FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- 12. stock_movements
DROP POLICY IF EXISTS "stockmov_role_select" ON public.stock_movements;
DROP POLICY IF EXISTS "stockmov_role_write" ON public.stock_movements;
DROP POLICY IF EXISTS "stockmov_role_update" ON public.stock_movements;
DROP POLICY IF EXISTS "stockmov_role_delete" ON public.stock_movements;
CREATE POLICY "stockmov_select" ON public.stock_movements FOR SELECT TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role) OR has_role(auth.uid(),'viewer'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "stockmov_insert" ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "stockmov_update" ON public.stock_movements FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "stockmov_delete" ON public.stock_movements FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

-- 13. crm_pipeline_stages (via join)
DROP POLICY IF EXISTS "Users can manage stages of their company" ON public.crm_pipeline_stages;
CREATE POLICY "Stages by pipeline company" ON public.crm_pipeline_stages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.crm_pipelines p WHERE p.id = crm_pipeline_stages.pipeline_id AND p.company_id = public.get_user_company_id(auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.crm_pipelines p WHERE p.id = crm_pipeline_stages.pipeline_id AND p.company_id = public.get_user_company_id(auth.uid())));

-- 14. enterprise_groups (via companies)
DROP POLICY IF EXISTS "Users can see groups they belong to" ON public.enterprise_groups;
CREATE POLICY "Users see groups of their company" ON public.enterprise_groups FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.group_id = enterprise_groups.id AND c.id = public.get_user_company_id(auth.uid())));

-- 15. enterprise_segments (via companies)
DROP POLICY IF EXISTS "Authenticated users can view segments" ON public.enterprise_segments;
CREATE POLICY "Users see segments of their company" ON public.enterprise_segments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.segment_id = enterprise_segments.id AND c.id = public.get_user_company_id(auth.uid())));

-- 16. feature_flags
DROP POLICY IF EXISTS "feature_flags_tenant_read" ON public.feature_flags;
CREATE POLICY "feature_flags_read_by_company" ON public.feature_flags FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR company_id IS NULL);

-- 17. system_audit_logs
DROP POLICY IF EXISTS "Users can view audit logs for their company" ON public.system_audit_logs;
CREATE POLICY "audit_logs_by_company" ON public.system_audit_logs FOR SELECT TO authenticated
  USING (company_id IS NOT NULL AND company_id = public.get_user_company_id(auth.uid()));

-- 18. cross_module_events
DROP POLICY IF EXISTS "cme_role_select" ON public.cross_module_events;
DROP POLICY IF EXISTS "cme_role_insert" ON public.cross_module_events;
CREATE POLICY "cme_select" ON public.cross_module_events FOR SELECT TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role) OR has_role(auth.uid(),'viewer'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "cme_insert" ON public.cross_module_events FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));

-- 19. lot_migration_audit
DROP POLICY IF EXISTS "lot_audit_read_admin" ON public.lot_migration_audit;
CREATE POLICY "lot_audit_read_by_company" ON public.lot_migration_audit FOR SELECT TO authenticated
  USING ((has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)) AND company_id = public.get_user_company_id(auth.uid()));
