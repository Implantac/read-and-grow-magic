
-- =========================
-- 1) clients: remove broad policies
-- =========================
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

-- =========================
-- 2) orders: remove broad policies
-- =========================
DROP POLICY IF EXISTS "Authenticated users can read orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;

-- =========================
-- 3) suppliers: remove broad, keep role-restricted
-- =========================
DROP POLICY IF EXISTS "Authenticated users can read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;

-- =========================
-- 4) financial_ledger: scope SELECT to company
-- =========================
DROP POLICY IF EXISTS "Authenticated can view financial_ledger" ON public.financial_ledger;
DROP POLICY IF EXISTS "Authenticated can insert financial_ledger" ON public.financial_ledger;
DROP POLICY IF EXISTS "Authenticated can update financial_ledger" ON public.financial_ledger;

CREATE POLICY "ledger_tenant_select" ON public.financial_ledger FOR SELECT TO authenticated
  USING (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "ledger_tenant_insert" ON public.financial_ledger FOR INSERT TO authenticated
  WITH CHECK ((company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()))
              AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator')));
CREATE POLICY "ledger_tenant_update" ON public.financial_ledger FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- =========================
-- 5) financial_boletos: scope to company
-- =========================
DROP POLICY IF EXISTS "auth read boletos" ON public.financial_boletos;
DROP POLICY IF EXISTS "auth insert boletos" ON public.financial_boletos;
DROP POLICY IF EXISTS "auth update boletos" ON public.financial_boletos;
DROP POLICY IF EXISTS "auth delete boletos" ON public.financial_boletos;

CREATE POLICY "boletos_tenant_select" ON public.financial_boletos FOR SELECT TO authenticated
  USING (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "boletos_tenant_insert" ON public.financial_boletos FOR INSERT TO authenticated
  WITH CHECK ((company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()))
              AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator')));
CREATE POLICY "boletos_tenant_update" ON public.financial_boletos FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "boletos_tenant_delete" ON public.financial_boletos FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

-- =========================
-- 6) Tables without company_id: tighten broad true to role-based
-- nfe, nfce, fiscal_reports, purchase_orders, stock_movements, stock_lots,
-- sales, sale_items, journal_entries, commission_payments, pix_charges, cross_module_events
-- =========================

-- nfe
DROP POLICY IF EXISTS "Authenticated can read nfe" ON public.nfe;
DROP POLICY IF EXISTS "Authenticated can insert nfe" ON public.nfe;
DROP POLICY IF EXISTS "Authenticated can update nfe" ON public.nfe;
DROP POLICY IF EXISTS "Authenticated can delete nfe" ON public.nfe;
CREATE POLICY "nfe_role_select" ON public.nfe FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "nfe_role_write" ON public.nfe FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "nfe_role_update" ON public.nfe FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "nfe_role_delete" ON public.nfe FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- nfce
DROP POLICY IF EXISTS "Auth users can read nfce" ON public.nfce;
DROP POLICY IF EXISTS "Auth users can insert nfce" ON public.nfce;
DROP POLICY IF EXISTS "Auth users can update nfce" ON public.nfce;
DROP POLICY IF EXISTS "Auth users can delete nfce" ON public.nfce;
CREATE POLICY "nfce_role_select" ON public.nfce FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "nfce_role_write" ON public.nfce FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "nfce_role_update" ON public.nfce FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "nfce_role_delete" ON public.nfce FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- fiscal_reports
DROP POLICY IF EXISTS "Auth users can read fiscal_reports" ON public.fiscal_reports;
DROP POLICY IF EXISTS "Auth users can insert fiscal_reports" ON public.fiscal_reports;
DROP POLICY IF EXISTS "Auth users can update fiscal_reports" ON public.fiscal_reports;
DROP POLICY IF EXISTS "Auth users can delete fiscal_reports" ON public.fiscal_reports;
CREATE POLICY "fiscal_reports_role_select" ON public.fiscal_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "fiscal_reports_role_write" ON public.fiscal_reports FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "fiscal_reports_role_update" ON public.fiscal_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "fiscal_reports_role_delete" ON public.fiscal_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- purchase_orders
DROP POLICY IF EXISTS "Auth users can read purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Auth users can insert purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Auth users can update purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Auth users can delete purchase_orders" ON public.purchase_orders;
CREATE POLICY "po_role_select" ON public.purchase_orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "po_role_write" ON public.purchase_orders FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "po_role_update" ON public.purchase_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "po_role_delete" ON public.purchase_orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- stock_movements
DROP POLICY IF EXISTS "Auth users can read stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Auth users can insert stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Auth users can update stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Auth users can delete stock_movements" ON public.stock_movements;
CREATE POLICY "stockmov_role_select" ON public.stock_movements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "stockmov_role_write" ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "stockmov_role_update" ON public.stock_movements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "stockmov_role_delete" ON public.stock_movements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- stock_lots
DROP POLICY IF EXISTS "Authenticated users can read stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "Authenticated users can insert stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "Authenticated users can update stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "Authenticated users can delete stock_lots" ON public.stock_lots;
CREATE POLICY "stocklots_role_select" ON public.stock_lots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "stocklots_role_write" ON public.stock_lots FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "stocklots_role_update" ON public.stock_lots FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "stocklots_role_delete" ON public.stock_lots FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- sales
DROP POLICY IF EXISTS "Authenticated users can read sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;
CREATE POLICY "sales_role_select" ON public.sales FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "sales_role_write" ON public.sales FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "sales_role_update" ON public.sales FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "sales_role_delete" ON public.sales FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- sale_items
DROP POLICY IF EXISTS "Authenticated users can read sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can insert sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can update sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can delete sale_items" ON public.sale_items;
CREATE POLICY "saleitems_role_select" ON public.sale_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "saleitems_role_write" ON public.sale_items FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "saleitems_role_update" ON public.sale_items FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));
CREATE POLICY "saleitems_role_delete" ON public.sale_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- journal_entries
DROP POLICY IF EXISTS "Auth users can read journal_entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Auth users can insert journal_entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Auth users can update journal_entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Auth users can delete journal_entries" ON public.journal_entries;
CREATE POLICY "je_role_select" ON public.journal_entries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "je_role_write" ON public.journal_entries FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "je_role_update" ON public.journal_entries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "je_role_delete" ON public.journal_entries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- commission_payments (financial sensitivity -> admin/manager only)
DROP POLICY IF EXISTS "Auth users can read commission_payments" ON public.commission_payments;
DROP POLICY IF EXISTS "Auth users can insert commission_payments" ON public.commission_payments;
DROP POLICY IF EXISTS "Auth users can update commission_payments" ON public.commission_payments;
DROP POLICY IF EXISTS "Auth users can delete commission_payments" ON public.commission_payments;
CREATE POLICY "comm_role_select" ON public.commission_payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "comm_role_write" ON public.commission_payments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "comm_role_update" ON public.commission_payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "comm_role_delete" ON public.commission_payments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- pix_charges: restrict SELECT to roles
DROP POLICY IF EXISTS "pix_charges_select" ON public.pix_charges;
CREATE POLICY "pix_charges_select" ON public.pix_charges FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));

-- cross_module_events: require role
DROP POLICY IF EXISTS "Authenticated can read cross-module events" ON public.cross_module_events;
DROP POLICY IF EXISTS "Authenticated can insert cross-module events" ON public.cross_module_events;
CREATE POLICY "cme_role_select" ON public.cross_module_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "cme_role_insert" ON public.cross_module_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'operator'));

-- =========================
-- 7) AI Brain
-- =========================
-- ai_brain_memory: only admin can write global/company; users can manage own
DROP POLICY IF EXISTS "brain_memory_insert_authenticated" ON public.ai_brain_memory;
DROP POLICY IF EXISTS "brain_memory_update_authenticated" ON public.ai_brain_memory;
DROP POLICY IF EXISTS "brain_memory_delete_authenticated" ON public.ai_brain_memory;

CREATE POLICY "brain_memory_insert" ON public.ai_brain_memory FOR INSERT TO authenticated
  WITH CHECK (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope IN ('global','company') AND public.has_role(auth.uid(),'admin'))
  );
CREATE POLICY "brain_memory_update" ON public.ai_brain_memory FOR UPDATE TO authenticated
  USING (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope IN ('global','company') AND public.has_role(auth.uid(),'admin'))
  );
CREATE POLICY "brain_memory_delete" ON public.ai_brain_memory FOR DELETE TO authenticated
  USING (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope IN ('global','company') AND public.has_role(auth.uid(),'admin'))
  );

-- ai_brain_decisions: restrict mutations to admin/manager; read to roles
DROP POLICY IF EXISTS "brain_decisions_all_authenticated" ON public.ai_brain_decisions;
CREATE POLICY "brain_decisions_select" ON public.ai_brain_decisions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'viewer'));
CREATE POLICY "brain_decisions_insert" ON public.ai_brain_decisions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "brain_decisions_update" ON public.ai_brain_decisions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "brain_decisions_delete" ON public.ai_brain_decisions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- ai_brain_runs: admin/manager only
DROP POLICY IF EXISTS "brain_runs_all_authenticated" ON public.ai_brain_runs;
CREATE POLICY "brain_runs_select" ON public.ai_brain_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "brain_runs_write" ON public.ai_brain_runs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "brain_runs_update" ON public.ai_brain_runs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- =========================
-- 8) Profiles: scope admin reads/updates to same company
-- =========================
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins read same-company profiles" ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    AND company_id IS NOT NULL
    AND company_id = public.get_user_company_id(auth.uid())
  );
CREATE POLICY "Admins update same-company profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    AND company_id IS NOT NULL
    AND company_id = public.get_user_company_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    AND company_id = public.get_user_company_id(auth.uid())
  );

-- =========================
-- 9) financial_security_logs: explicit deny INSERT via API (service role bypasses RLS)
-- =========================
DROP POLICY IF EXISTS "deny api insert security logs" ON public.financial_security_logs;
CREATE POLICY "deny api insert security logs" ON public.financial_security_logs
  AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);
