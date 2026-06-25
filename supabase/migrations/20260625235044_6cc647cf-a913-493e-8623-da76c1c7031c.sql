
-- QA-002: scope admin writes on branches to own company
DROP POLICY IF EXISTS "Admins and managers can manage branches" ON public.branches;

CREATE POLICY "Admins and managers can manage branches"
ON public.branches
FOR ALL
TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::text) AND company_id = get_user_company_id(auth.uid()))
  OR (
    has_role(auth.uid(), 'manager'::text)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id = branches.company_id
    )
  )
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::text) AND company_id = get_user_company_id(auth.uid()))
  OR (
    has_role(auth.uid(), 'manager'::text)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id = branches.company_id
    )
  )
);

-- QA-003 & QA-004: remove duplicate policies on user_roles, keep the "in their company" set
DROP POLICY IF EXISTS "Admins can view roles in company"   ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles in company" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles in company" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles in company" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role"            ON public.user_roles;
