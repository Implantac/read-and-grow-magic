-- Global RLS Audit & Hardening (Partial Fix)
-- This migration updates core tables to ensure company_id isolation is enforced.

-- Products
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
CREATE POLICY "products_select_policy" ON public.products FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));

-- Categories
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
CREATE POLICY "categories_select_policy" ON public.categories FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));

-- Clients
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
CREATE POLICY "clients_select_policy" ON public.clients FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));

-- Sales (verified table name is 'sales')
DROP POLICY IF EXISTS "sales_select_policy" ON public.sales;
CREATE POLICY "sales_select_policy" ON public.sales FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));

-- Bank Accounts (verified table name is 'bank_accounts')
DROP POLICY IF EXISTS "bank_accounts_select_policy" ON public.bank_accounts;
CREATE POLICY "bank_accounts_select_policy" ON public.bank_accounts FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
