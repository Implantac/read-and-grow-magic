
-- Helper: split ALL policies into per-command policies with role checks.
-- Preserves reads for all tenant members; restricts writes by role.

-- =============== bank_accounts ===============
DROP POLICY IF EXISTS bank_accounts_tenant_isolation ON public.bank_accounts;
CREATE POLICY bank_accounts_select ON public.bank_accounts FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY bank_accounts_insert ON public.bank_accounts FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)));
CREATE POLICY bank_accounts_update ON public.bank_accounts FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)));
CREATE POLICY bank_accounts_delete ON public.bank_accounts FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(),'admin'::app_role));

-- =============== bank_transactions ===============
DROP POLICY IF EXISTS bank_transactions_tenant_isolation ON public.bank_transactions;
CREATE POLICY bank_transactions_select ON public.bank_transactions FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY bank_transactions_insert ON public.bank_transactions FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)));
CREATE POLICY bank_transactions_update ON public.bank_transactions FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)));
CREATE POLICY bank_transactions_delete ON public.bank_transactions FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)));

-- =============== bank_transfers ===============
DROP POLICY IF EXISTS bank_transfers_tenant_isolation ON public.bank_transfers;
CREATE POLICY bank_transfers_select ON public.bank_transfers FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY bank_transfers_insert ON public.bank_transfers FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)));
CREATE POLICY bank_transfers_update ON public.bank_transfers FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)));
CREATE POLICY bank_transfers_delete ON public.bank_transfers FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(),'admin'::app_role));

-- =============== cash_flow_entries ===============
DROP POLICY IF EXISTS cash_flow_entries_tenant_isolation ON public.cash_flow_entries;
CREATE POLICY cash_flow_entries_select ON public.cash_flow_entries FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY cash_flow_entries_insert ON public.cash_flow_entries FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)));
CREATE POLICY cash_flow_entries_update ON public.cash_flow_entries FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)));
CREATE POLICY cash_flow_entries_delete ON public.cash_flow_entries FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)));

-- =============== financial_checks ===============
DROP POLICY IF EXISTS financial_checks_tenant_all ON public.financial_checks;
CREATE POLICY financial_checks_select ON public.financial_checks FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY financial_checks_insert ON public.financial_checks FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)));
CREATE POLICY financial_checks_update ON public.financial_checks FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)));
CREATE POLICY financial_checks_delete ON public.financial_checks FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(),'admin'::app_role));

-- =============== financial_settlements ===============
DROP POLICY IF EXISTS financial_settlements_tenant_isolation ON public.financial_settlements;
CREATE POLICY financial_settlements_select ON public.financial_settlements FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY financial_settlements_insert ON public.financial_settlements FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)));
CREATE POLICY financial_settlements_update ON public.financial_settlements FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)));
CREATE POLICY financial_settlements_delete ON public.financial_settlements FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(),'admin'::app_role));

-- =============== payment_records ===============
DROP POLICY IF EXISTS payment_records_tenant_isolation ON public.payment_records;
CREATE POLICY payment_records_select ON public.payment_records FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY payment_records_insert ON public.payment_records FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'operator'::app_role)));
CREATE POLICY payment_records_update ON public.payment_records FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)))
  WITH CHECK (company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)));
CREATE POLICY payment_records_delete ON public.payment_records FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(),'admin'::app_role));

-- =============== financial_ledger: remove operator from INSERT ===============
DROP POLICY IF EXISTS ledger_tenant_insert ON public.financial_ledger;
CREATE POLICY ledger_tenant_insert ON public.financial_ledger FOR INSERT TO authenticated
  WITH CHECK (company_id IS NOT NULL
    AND company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role)));
