
-- 1. Revoke anon EXECUTE on trigger-only function
REVOKE EXECUTE ON FUNCTION public.apply_stock_movement_to_balance() FROM PUBLIC, anon, authenticated;

-- 2. products: column-level restriction for anon (RLS keeps row filtering; column grants hide sensitive cols)
REVOKE SELECT ON public.products FROM anon;
GRANT SELECT (id, name, description, image_url, sale_price, category_id, subcategory, brand, unit, status, company_id)
  ON public.products TO anon;

-- 3. branches: tighten SELECT policy to always require same company
DROP POLICY IF EXISTS "Users can view branches of their companies" ON public.branches;
CREATE POLICY "Users can view branches of their companies"
  ON public.branches
  FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
