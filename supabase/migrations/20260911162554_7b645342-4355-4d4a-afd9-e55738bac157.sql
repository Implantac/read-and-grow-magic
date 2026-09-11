DROP POLICY IF EXISTS "Auth users can manage own accounts_payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can insert accounts_payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "accounts_payable_tenant_all" ON public.accounts_payable;

DROP POLICY IF EXISTS "Auth users can manage own accounts_receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users can insert accounts_receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "accounts_receivable_tenant_all" ON public.accounts_receivable;

DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

DROP POLICY IF EXISTS "stock_movements_tenant_all" ON public.stock_movements;