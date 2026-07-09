
-- 1) Revoke public execute on SECURITY DEFINER trigger function
REVOKE ALL ON FUNCTION public.nps_auto_create_followup() FROM PUBLIC, anon, authenticated;

-- 2) billing_meters: add authenticated read (tenant-scoped when column exists; otherwise catalog)
DO $$
DECLARE
  has_company boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='billing_meters' AND column_name='company_id'
  ) INTO has_company;

  IF has_company THEN
    EXECUTE $p$
      CREATE POLICY "Authenticated read own-tenant meters"
      ON public.billing_meters
      FOR SELECT TO authenticated
      USING (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()))
    $p$;
  ELSE
    EXECUTE $p$
      CREATE POLICY "Authenticated read meter catalog"
      ON public.billing_meters
      FOR SELECT TO authenticated
      USING (true)
    $p$;
  END IF;
END $$;

-- 3) user_roles: tighten UPDATE USING clause so admins cannot target their own row
DROP POLICY IF EXISTS "Admins update roles in their company" ON public.user_roles;
CREATE POLICY "Admins update roles in their company"
ON public.user_roles
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
  AND role <> 'system_admin'::app_role
  AND role <> 'admin'::app_role
  AND user_id <> auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
  AND role <> 'system_admin'::app_role
  AND role <> 'admin'::app_role
  AND user_id <> auth.uid()
);

-- 4) has_role 3-arg overloads: enforce that _company_id must equal the user's actual company.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND ur.company_id IS NOT NULL
      AND ur.company_id = _company_id
      AND ur.company_id = public.get_user_company_id(_user_id)
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role::text = _role
      AND ur.company_id IS NOT NULL
      AND ur.company_id = _company_id
      AND ur.company_id = public.get_user_company_id(_user_id)
  )
$$;

-- 5) Realtime topic policies: switch from LIKE patterns to exact-segment parsing via split_part
DROP POLICY IF EXISTS "Authenticated can read company-scoped realtime topics" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can publish company-scoped realtime topics" ON realtime.messages;

CREATE POLICY "Authenticated can read company-scoped realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (
    split_part(realtime.topic(), ':', 1) = 'company'
    AND split_part(realtime.topic(), ':', 2) = COALESCE(public.get_user_company_id(auth.uid())::text, '__none__')
  )
  OR (
    split_part(realtime.topic(), ':', 1) = 'user'
    AND split_part(realtime.topic(), ':', 2) = auth.uid()::text
  )
  OR (
    split_part(realtime.topic(), ':', 1) = 'admin'
    AND split_part(realtime.topic(), ':', 2) = COALESCE(public.get_user_company_id(auth.uid())::text, '__none__')
    AND public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Authenticated can publish company-scoped realtime topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (
    split_part(realtime.topic(), ':', 1) = 'company'
    AND split_part(realtime.topic(), ':', 2) = COALESCE(public.get_user_company_id(auth.uid())::text, '__none__')
  )
  OR (
    split_part(realtime.topic(), ':', 1) = 'user'
    AND split_part(realtime.topic(), ':', 2) = auth.uid()::text
  )
  OR (
    split_part(realtime.topic(), ':', 1) = 'admin'
    AND split_part(realtime.topic(), ':', 2) = COALESCE(public.get_user_company_id(auth.uid())::text, '__none__')
    AND public.has_role(auth.uid(), 'admin'::app_role)
  )
);
