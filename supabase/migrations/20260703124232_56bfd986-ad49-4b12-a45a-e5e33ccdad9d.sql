-- ============================================================
-- 1. order_items: enforce company_id == orders.company_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_order_items_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  parent_company uuid;
BEGIN
  SELECT company_id INTO parent_company FROM public.orders WHERE id = NEW.order_id;
  IF parent_company IS NULL THEN
    RAISE EXCEPTION 'order_items: parent order % not found', NEW.order_id;
  END IF;
  IF NEW.company_id IS NULL THEN
    NEW.company_id := parent_company;
  ELSIF NEW.company_id <> parent_company THEN
    RAISE EXCEPTION 'order_items.company_id (%) must match orders.company_id (%)', NEW.company_id, parent_company;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_enforce_tenant ON public.order_items;
CREATE TRIGGER trg_order_items_enforce_tenant
BEFORE INSERT OR UPDATE OF order_id, company_id ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_items_tenant();

-- ============================================================
-- 2. companies: deny INSERT to authenticated (service_role only)
-- ============================================================
DROP POLICY IF EXISTS "companies_no_client_insert" ON public.companies;
CREATE POLICY "companies_no_client_insert"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (false);

-- ============================================================
-- 3. user_roles: scope "view own role" to current company
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  AND company_id = public.get_user_company_id(auth.uid())
);

-- ============================================================
-- 4. storage.objects avatars: enforce strict <uid>/<file> path
-- ============================================================
DROP POLICY IF EXISTS "Avatars: authenticated read own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: users can upload their own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: users can update their own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: users can delete their own" ON storage.objects;

CREATE POLICY "Avatars: authenticated read own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND array_length(storage.foldername(name), 1) = 1
);

CREATE POLICY "Avatars: users can upload their own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND array_length(storage.foldername(name), 1) = 1
);

CREATE POLICY "Avatars: users can update their own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND array_length(storage.foldername(name), 1) = 1
);

CREATE POLICY "Avatars: users can delete their own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND array_length(storage.foldername(name), 1) = 1
);