
-- 1) user_roles UPDATE policy scoped to authenticated
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
  AND user_id <> auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
  AND role <> 'system_admin'::app_role
  AND role <> 'admin'::app_role
  AND user_id <> auth.uid()
);

-- 2) fiscal-certs storage: split admin (full) vs manager (read + insert only)
DROP POLICY IF EXISTS fiscal_certs_admin_manager_all ON storage.objects;

CREATE POLICY fiscal_certs_admin_all
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'fiscal-certs'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND (storage.foldername(name))[1] IN (
    SELECT profiles.company_id::text FROM profiles WHERE profiles.id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'fiscal-certs'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND (storage.foldername(name))[1] IN (
    SELECT profiles.company_id::text FROM profiles WHERE profiles.id = auth.uid()
  )
);

CREATE POLICY fiscal_certs_manager_read
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'fiscal-certs'
  AND has_role(auth.uid(), 'manager'::app_role)
  AND (storage.foldername(name))[1] IN (
    SELECT profiles.company_id::text FROM profiles WHERE profiles.id = auth.uid()
  )
);

CREATE POLICY fiscal_certs_manager_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fiscal-certs'
  AND has_role(auth.uid(), 'manager'::app_role)
  AND (storage.foldername(name))[1] IN (
    SELECT profiles.company_id::text FROM profiles WHERE profiles.id = auth.uid()
  )
);

-- 3) Revoke EXECUTE from anon/PUBLIC on trigger-only SECURITY DEFINER function
REVOKE EXECUTE ON FUNCTION public.prevent_profile_tenant_hijack() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_tenant_hijack() FROM anon;
