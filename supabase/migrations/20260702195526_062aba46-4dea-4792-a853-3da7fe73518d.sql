
-- 1) order_items: use company-scoped has_role overload
DROP POLICY IF EXISTS order_items_tenant_insert ON public.order_items;
DROP POLICY IF EXISTS order_items_tenant_update ON public.order_items;

CREATE POLICY order_items_tenant_insert ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.company_id = public.get_user_company_id(auth.uid())
  )
  AND (
    public.has_role(auth.uid(), 'admin'::app_role, public.get_user_company_id(auth.uid()))
    OR public.has_role(auth.uid(), 'manager'::app_role, public.get_user_company_id(auth.uid()))
  )
);

CREATE POLICY order_items_tenant_update ON public.order_items
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.company_id = public.get_user_company_id(auth.uid())
  )
  AND (
    public.has_role(auth.uid(), 'admin'::app_role, public.get_user_company_id(auth.uid()))
    OR public.has_role(auth.uid(), 'manager'::app_role, public.get_user_company_id(auth.uid()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.company_id = public.get_user_company_id(auth.uid())
  )
  AND (
    public.has_role(auth.uid(), 'admin'::app_role, public.get_user_company_id(auth.uid()))
    OR public.has_role(auth.uid(), 'manager'::app_role, public.get_user_company_id(auth.uid()))
  )
);

-- 2) profiles: block admins from mutating sensitive fields of other users
CREATE OR REPLACE FUNCTION public.fn_profiles_guard_admin_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() = NEW.id THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.company_id IS DISTINCT FROM OLD.company_id
     OR COALESCE(NEW.email,'') IS DISTINCT FROM COALESCE(OLD.email,'')
     OR COALESCE(NEW.phone,'') IS DISTINCT FROM COALESCE(OLD.phone,'') THEN
    RAISE EXCEPTION 'Admins cannot modify identity fields (id, company_id, email, phone) of other users'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_admin_update ON public.profiles;
CREATE TRIGGER trg_profiles_guard_admin_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.fn_profiles_guard_admin_update();

-- 3) ai_brain_memory: enforce company_id NOT NULL for scope='global' via CHECK-like trigger
-- (We can't add NOT NULL because scope='user' rows may lack company_id; instead enforce conditionally.)
CREATE OR REPLACE FUNCTION public.fn_ai_brain_memory_enforce_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.scope IN ('company','global') AND NEW.company_id IS NULL THEN
    RAISE EXCEPTION 'company_id is required when scope is % ', NEW.scope
      USING ERRCODE = '23502';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_brain_memory_enforce_company ON public.ai_brain_memory;
CREATE TRIGGER trg_ai_brain_memory_enforce_company
BEFORE INSERT OR UPDATE ON public.ai_brain_memory
FOR EACH ROW
EXECUTE FUNCTION public.fn_ai_brain_memory_enforce_company();

-- Tighten SELECT policy to require non-null company_id for scoped rows
DROP POLICY IF EXISTS ai_brain_memory_select ON public.ai_brain_memory;
CREATE POLICY ai_brain_memory_select ON public.ai_brain_memory
FOR SELECT TO authenticated
USING (
  ((scope = 'user') AND (user_id = auth.uid()))
  OR ((scope = 'company') AND company_id IS NOT NULL AND company_id = public.get_user_company_id(auth.uid()))
  OR ((scope = 'global') AND company_id IS NOT NULL AND company_id = public.get_user_company_id(auth.uid())
       AND public.has_role(auth.uid(), 'admin'::app_role, public.get_user_company_id(auth.uid())))
);

-- 4) Revoke public/anon execute on SECURITY DEFINER RPC
REVOKE EXECUTE ON FUNCTION public.record_forecast_snapshot(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_forecast_snapshot(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_forecast_snapshot(uuid, text, text) TO authenticated, service_role;
