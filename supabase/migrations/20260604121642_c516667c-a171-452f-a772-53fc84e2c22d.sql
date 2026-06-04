-- =====================================================================
-- 🛡️ SEGURANÇA: HARDENING DE RLS E ISOLAMENTO MULTI-TENANT
-- =====================================================================

-- 1. Tabelas que estavam com USING (true) ou permissivas demais
-- Financial Alerts
DROP POLICY IF EXISTS "auth read fin alerts" ON public.financial_alerts;
DROP POLICY IF EXISTS "Auth users manage financial_alerts" ON public.financial_alerts;
CREATE POLICY "financial_alerts_tenant_all" ON public.financial_alerts
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- Tax Rules (SELECT estava true)
DROP POLICY IF EXISTS "tax_rules_select_authenticated" ON public.tax_rules;
CREATE POLICY "tax_rules_tenant_select" ON public.tax_rules
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- Credit Policies
DROP POLICY IF EXISTS "Auth users can read credit_policies" ON public.credit_policies;
DROP POLICY IF EXISTS "Auth users can insert credit_policies" ON public.credit_policies;
DROP POLICY IF EXISTS "Auth users can update credit_policies" ON public.credit_policies;
DROP POLICY IF EXISTS "Auth users can delete credit_policies" ON public.credit_policies;
CREATE POLICY "credit_policies_tenant_all" ON public.credit_policies
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- Sales & Sale Items (Estavam apenas por role, sem tenant filter)
DROP POLICY IF EXISTS "sales_role_select" ON public.sales;
DROP POLICY IF EXISTS "sales_role_write" ON public.sales;
DROP POLICY IF EXISTS "sales_role_update" ON public.sales;
DROP POLICY IF EXISTS "sales_role_delete" ON public.sales;
CREATE POLICY "sales_tenant_all" ON public.sales
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "saleitems_role_select" ON public.sale_items;
DROP POLICY IF EXISTS "saleitems_role_write" ON public.sale_items;
DROP POLICY IF EXISTS "saleitems_role_update" ON public.sale_items;
DROP POLICY IF EXISTS "saleitems_role_delete" ON public.sale_items;
CREATE POLICY "sale_items_tenant_all" ON public.sale_items
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- Feature Flags & Plan Features (Removendo acesso público)
DROP POLICY IF EXISTS "feature_flags_read_authenticated" ON public.feature_flags;
CREATE POLICY "feature_flags_tenant_read" ON public.feature_flags
  FOR SELECT TO authenticated
  USING (true); -- Flags de sistema podem ser lidas por todos os logados

DROP POLICY IF EXISTS "Anyone can view plan features" ON public.plan_features;
CREATE POLICY "plan_features_read_authenticated" ON public.plan_features
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================================
-- 🔐 SEGURANÇA DE FUNÇÕES (SECURITY DEFINER)
-- =====================================================================

-- Revogar execução de funções de escrita/administrativas sensíveis
REVOKE EXECUTE ON FUNCTION public.close_accounting_period(integer, integer) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.reopen_accounting_period(integer, integer) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.generate_sped_contribuicoes(date, date) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.generate_sped_fiscal(date, date) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.batch_pay_payables(uuid[], uuid, text, date, text) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.reverse_settlement(uuid, text) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.compensate_accounts(uuid, uuid, numeric, text) FROM authenticated, anon;

-- Corrigir funções de leitura que não filtravam por tenant
CREATE OR REPLACE FUNCTION public.get_dre_summary(_from date, _to date)
 RETURNS TABLE(section text, total numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH c AS (
    SELECT
      COALESCE(fc.dre_section, CASE WHEN l.type='inflow' THEN 'revenue' ELSE 'operating_expense' END) AS section,
      CASE WHEN l.type='inflow' THEN l.amount ELSE -l.amount END AS amt
    FROM public.financial_ledger l
    LEFT JOIN public.financial_categories fc ON fc.id = l.category_id
    WHERE l.entry_date BETWEEN _from AND _to
      AND l.company_id = public.get_user_company_id(auth.uid()) -- Filtro de tenant adicionado
  )
  SELECT section, SUM(amt) FROM c GROUP BY section ORDER BY section;
$function$;

CREATE OR REPLACE FUNCTION public.get_account_statement(_entity_type text, _entity_id uuid, _from date DEFAULT ((CURRENT_DATE - '180 days'::interval))::date, _to date DEFAULT CURRENT_DATE)
 RETURNS TABLE(entry_date date, kind text, category text, description text, reference text, amount numeric, running_balance numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_running numeric := 0;
        v_company_id uuid := public.get_user_company_id(auth.uid()); -- Filtro de tenant
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT ar.due_date::date AS entry_date, 'debit'::text AS kind,
           CASE WHEN ar.source_type='sale' THEN 'sale' ELSE 'receivable' END AS category,
           ar.description, ar.invoice_number AS reference, ar.amount
      FROM public.accounts_receivable ar
     WHERE _entity_type = 'client' AND ar.client_id = _entity_id
       AND ar.company_id = v_company_id -- Filtro
       AND ar.due_date BETWEEN _from AND _to
    UNION ALL
    SELECT fs.settlement_date, 'credit', fs.payment_method,
           'Baixa: ' || COALESCE(fs.notes,''), fs.id::text, fs.total_settled
      FROM public.financial_settlements fs
      JOIN public.accounts_receivable ar ON ar.id = fs.source_id
     WHERE _entity_type = 'client' AND fs.source_type='receivable' AND fs.status='active'
       AND ar.client_id = _entity_id
       AND fs.company_id = v_company_id -- Filtro
       AND fs.settlement_date BETWEEN _from AND _to
    UNION ALL
    SELECT ap.due_date::date, 'credit',
           CASE WHEN ap.source_type='purchase' THEN 'purchase' ELSE 'payable' END,
           ap.description, ap.invoice_number, ap.amount
      FROM public.accounts_payable ap
     WHERE _entity_type = 'supplier' AND ap.supplier = (SELECT name FROM public.suppliers WHERE id = _entity_id AND company_id = v_company_id)
       AND ap.company_id = v_company_id -- Filtro
       AND ap.due_date BETWEEN _from AND _to
    UNION ALL
    SELECT fs.settlement_date, 'debit', fs.payment_method,
           'Pagamento: ' || COALESCE(fs.notes,''), fs.id::text, fs.total_settled
      FROM public.financial_settlements fs
      JOIN public.accounts_payable ap ON ap.id = fs.source_id
     WHERE _entity_type = 'supplier' AND fs.source_type='payable' AND fs.status='active'
       AND ap.supplier = (SELECT name FROM public.suppliers WHERE id = _entity_id AND company_id = v_company_id)
       AND fs.company_id = v_company_id -- Filtro
       AND fs.settlement_date BETWEEN _from AND _to
  )
  SELECT b.entry_date, b.kind, b.category, b.description, b.reference, b.amount,
         SUM(CASE WHEN b.kind='debit' THEN b.amount ELSE -b.amount END)
           OVER (ORDER BY b.entry_date, b.kind) AS running_balance
    FROM base b
   ORDER BY b.entry_date, b.kind;
END; $function$;

-- =====================================================================
-- 💾 BANCO DE DADOS: INTEGRIDADE E CONSISTÊNCIA
-- =====================================================================

-- Adicionando Foreign Keys e NOT NULL em colunas de tenant críticas
-- Nota: Usando subqueries para garantir que company_id esteja presente
UPDATE public.clients SET company_id = (SELECT company_id FROM public.profiles LIMIT 1) WHERE company_id IS NULL;
ALTER TABLE public.clients ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.clients ADD CONSTRAINT clients_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);

UPDATE public.bank_accounts SET company_id = (SELECT company_id FROM public.profiles LIMIT 1) WHERE company_id IS NULL;
ALTER TABLE public.bank_accounts ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.bank_accounts ADD CONSTRAINT bank_accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);

UPDATE public.financial_checks SET company_id = (SELECT company_id FROM public.profiles LIMIT 1) WHERE company_id IS NULL;
ALTER TABLE public.financial_checks ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.financial_checks ADD CONSTRAINT financial_checks_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);

-- Trigger de autopreenchimento para tabelas que faltavam
CREATE OR REPLACE TRIGGER trg_bank_accounts_set_company_id
  BEFORE INSERT ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

CREATE OR REPLACE TRIGGER trg_financial_checks_set_company_id
  BEFORE INSERT ON public.financial_checks
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

-- =====================================================================
-- 🚀 OTIMIZAÇÃO: ÍNDICES DE PERFORMANCE
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON public.sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_company_id ON public.sale_items(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON public.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_order_items_company_id ON public.order_items(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_company_id ON public.financial_ledger(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_company_id ON public.accounts_receivable(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_company_id ON public.accounts_payable(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_company_id ON public.bank_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_company_id ON public.stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_company_id ON public.production_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_wms_inventory_items_company_id ON public.wms_inventory_items(company_id);
