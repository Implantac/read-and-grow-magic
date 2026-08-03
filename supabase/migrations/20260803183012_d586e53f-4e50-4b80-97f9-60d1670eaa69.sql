-- Fixing RLS tenant isolation vulnerabilities across core tables (Corrected Signature)
-- This migration replaces insecure 'USING (true)' policies with strict company_id checks.

DROP POLICY IF EXISTS "Authenticated users can read categories" ON public.categories;
CREATE POLICY "Authenticated users can read categories" ON public.categories FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid())) ;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
CREATE POLICY "Authenticated users can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (company_id = get_user_company_id(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
CREATE POLICY "Authenticated users can update categories" ON public.categories FOR UPDATE TO authenticated USING (company_id = get_user_company_id(auth.uid())) WITH CHECK (company_id = get_user_company_id(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;
CREATE POLICY "Authenticated users can delete categories" ON public.categories FOR DELETE TO authenticated USING (company_id = get_user_company_id(auth.uid())) ;

DROP POLICY IF EXISTS "Authenticated users can read products" ON public.products;
CREATE POLICY "Authenticated users can read products" ON public.products FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid())) ;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (company_id = get_user_company_id(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE TO authenticated USING (company_id = get_user_company_id(auth.uid())) WITH CHECK (company_id = get_user_company_id(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE TO authenticated USING (company_id = get_user_company_id(auth.uid())) ;

DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
CREATE POLICY "Authenticated users can read clients" ON public.clients FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid())) ;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
CREATE POLICY "Authenticated users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (company_id = get_user_company_id(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE TO authenticated USING (company_id = get_user_company_id(auth.uid())) WITH CHECK (company_id = get_user_company_id(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;
CREATE POLICY "Authenticated users can delete clients" ON public.clients FOR DELETE TO authenticated USING (company_id = get_user_company_id(auth.uid())) ;

DROP POLICY IF EXISTS "Authenticated users can read orders" ON public.orders;
CREATE POLICY "Authenticated users can read orders" ON public.orders FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid())) ;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
CREATE POLICY "Authenticated users can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (company_id = get_user_company_id(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
CREATE POLICY "Authenticated users can update orders" ON public.orders FOR UPDATE TO authenticated USING (company_id = get_user_company_id(auth.uid())) WITH CHECK (company_id = get_user_company_id(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;
CREATE POLICY "Authenticated users can delete orders" ON public.orders FOR DELETE TO authenticated USING (company_id = get_user_company_id(auth.uid())) ;

DROP POLICY IF EXISTS "Authenticated users can read accounts_payable" ON public.accounts_payable;
CREATE POLICY "Authenticated users can read accounts_payable" ON public.accounts_payable FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid())) ;
DROP POLICY IF EXISTS "Authenticated users can insert accounts_payable" ON public.accounts_payable;
CREATE POLICY "Authenticated users can insert accounts_payable" ON public.accounts_payable FOR INSERT TO authenticated WITH CHECK (company_id = get_user_company_id(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can update accounts_payable" ON public.accounts_payable;
CREATE POLICY "Authenticated users can update accounts_payable" ON public.accounts_payable FOR UPDATE TO authenticated USING (company_id = get_user_company_id(auth.uid())) WITH CHECK (company_id = get_user_company_id(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can delete accounts_payable" ON public.accounts_payable;
CREATE POLICY "Authenticated users can delete accounts_payable" ON public.accounts_payable FOR DELETE TO authenticated USING (company_id = get_user_company_id(auth.uid())) ;

DROP POLICY IF EXISTS "Authenticated users can read accounts_receivable" ON public.accounts_receivable;
CREATE POLICY "Authenticated users can read accounts_receivable" ON public.accounts_receivable FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid())) ;
DROP POLICY IF EXISTS "Authenticated users can insert accounts_receivable" ON public.accounts_receivable;
CREATE POLICY "Authenticated users can insert accounts_receivable" ON public.accounts_receivable FOR INSERT TO authenticated WITH CHECK (company_id = get_user_company_id(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can update accounts_receivable" ON public.accounts_receivable;
CREATE POLICY "Authenticated users can update accounts_receivable" ON public.accounts_receivable FOR UPDATE TO authenticated USING (company_id = get_user_company_id(auth.uid())) WITH CHECK (company_id = get_user_company_id(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can delete accounts_receivable" ON public.accounts_receivable;
CREATE POLICY "Authenticated users can delete accounts_receivable" ON public.accounts_receivable FOR DELETE TO authenticated USING (company_id = get_user_company_id(auth.uid())) ;
