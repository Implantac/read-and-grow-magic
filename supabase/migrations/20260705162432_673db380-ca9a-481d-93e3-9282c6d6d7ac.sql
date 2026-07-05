-- Fix privilege escalation: an admin could UPDATE their own user_roles row
-- (USING clause allowed role='admin' when user_id = auth.uid()) and the
-- WITH CHECK only blocked role='admin', leaving room to escalate to
-- 'system_admin'. Rebuild the UPDATE policy so admins cannot touch admin
-- or system_admin rows at all, and cannot produce such rows via UPDATE.
-- Granting admin/system_admin remains exclusive to system_admin.

DROP POLICY IF EXISTS "Admins update roles in their company" ON public.user_roles;

CREATE POLICY "Admins update roles in their company"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
  AND role <> 'system_admin'::app_role
  AND role <> 'admin'::app_role
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
  AND role <> 'system_admin'::app_role
  AND role <> 'admin'::app_role
  AND user_id <> auth.uid()
);