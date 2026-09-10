DROP POLICY IF EXISTS "stock_movements_modify" ON public.stock_movements;

CREATE POLICY "stock_movements_modify" ON public.stock_movements
FOR ALL
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'manager'::text))
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'manager'::text))
);