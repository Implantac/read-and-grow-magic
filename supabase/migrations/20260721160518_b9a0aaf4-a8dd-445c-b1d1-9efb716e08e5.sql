
-- 1) Prevent users from switching their own tenant via profile self-update
CREATE OR REPLACE FUNCTION public.prevent_profile_tenant_self_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role and admins to change tenant assignments freely
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'Not allowed to change company_id on your own profile';
  END IF;

  IF NEW.branch_id IS DISTINCT FROM OLD.branch_id THEN
    RAISE EXCEPTION 'Not allowed to change branch_id on your own profile';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_tenant_self_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_tenant_self_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_tenant_self_change();

-- 2) Enforce that public checkout orders reference the storefront's own company_id
DROP POLICY IF EXISTS "Public can create orders on published storefronts" ON public.storefront_orders;

CREATE POLICY "Public can create orders on published storefronts"
ON public.storefront_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.storefronts s
    WHERE s.id = storefront_orders.storefront_id
      AND s.status = 'published'
      AND s.company_id = storefront_orders.company_id
  )
);
