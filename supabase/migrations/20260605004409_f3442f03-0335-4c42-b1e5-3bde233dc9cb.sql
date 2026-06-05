-- Fix Function Search Path Mutable for SECURITY DEFINER functions
-- CATEGORY: SECURITY

-- 1. get_user_role (Mantendo retorno app_role)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS public.app_role
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    _role public.app_role;
BEGIN
    SELECT role INTO _role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
    RETURN COALESCE(_role, 'viewer'::public.app_role);
END;
$function$;

-- 2. get_user_company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    _company_id uuid;
BEGIN
    SELECT company_id INTO _company_id FROM public.profiles WHERE id = _user_id LIMIT 1;
    RETURN _company_id;
END;
$function$;

-- 3. has_role (boolean)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = _user_id AND role::text = _role
    );
END;
$function$;

-- 4. has_role overload (boolean)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text, _company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = _user_id 
        AND role::text = _role 
        AND (company_id = _company_id OR company_id IS NULL)
    );
END;
$function$;

-- Standardizing permissions
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_company_id(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text, uuid) TO authenticated, service_role;
