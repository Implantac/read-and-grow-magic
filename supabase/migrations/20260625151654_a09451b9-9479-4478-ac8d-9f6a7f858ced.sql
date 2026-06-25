
CREATE OR REPLACE FUNCTION public.bootstrap_tenant(
  _company_name text,
  _cnpj text,
  _segment text,
  _address_street text,
  _address_number text,
  _address_neighborhood text,
  _address_city text,
  _address_state text,
  _address_zip text,
  _phone text DEFAULT NULL,
  _email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _existing uuid;
  _company_id uuid;
  _branch_id uuid;
  _plan_id uuid;
  _sub_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- Block users that already belong to a tenant
  SELECT company_id INTO _existing FROM public.profiles WHERE id = _user_id;
  IF _existing IS NOT NULL THEN
    RAISE EXCEPTION 'user_already_in_tenant';
  END IF;

  IF coalesce(trim(_company_name), '') = '' OR coalesce(trim(_cnpj), '') = '' THEN
    RAISE EXCEPTION 'missing_required_fields';
  END IF;

  -- Create company (headquarters)
  INSERT INTO public.companies (
    name, trade_name, cnpj, segment, status,
    address_street, address_number, address_neighborhood,
    address_city, address_state, address_zip_code,
    is_headquarters, phone, email
  ) VALUES (
    _company_name, _company_name, _cnpj, _segment, 'active',
    coalesce(_address_street, '-'), coalesce(_address_number, 'S/N'),
    coalesce(_address_neighborhood, '-'),
    coalesce(_address_city, '-'), coalesce(_address_state, 'SP'),
    coalesce(_address_zip, '00000-000'),
    true, _phone, _email
  )
  RETURNING id INTO _company_id;

  -- Create matrix branch
  INSERT INTO public.branches (
    company_id, name, code, is_headquarters, is_active,
    address_street, address_number, address_neighborhood,
    address_city, address_state, address_zip_code
  ) VALUES (
    _company_id, 'Matriz', 'MATRIZ', true, true,
    coalesce(_address_street, '-'), coalesce(_address_number, 'S/N'),
    coalesce(_address_neighborhood, '-'),
    coalesce(_address_city, '-'), coalesce(_address_state, 'SP'),
    coalesce(_address_zip, '00000-000')
  )
  RETURNING id INTO _branch_id;

  -- Link profile
  UPDATE public.profiles
    SET company_id = _company_id,
        branch_id = _branch_id,
        default_branch_id = _branch_id,
        updated_at = now()
  WHERE id = _user_id;

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role, company_id)
  VALUES (_user_id, 'admin', _company_id)
  ON CONFLICT DO NOTHING;

  -- Activate Starter plan in 14-day trial
  SELECT id INTO _plan_id FROM public.plans WHERE slug = 'starter' AND is_active = true LIMIT 1;
  IF _plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (
      company_id, plan_id, status, billing_cycle,
      current_period_start, current_period_end, trial_end
    ) VALUES (
      _company_id, _plan_id, 'trialing', 'monthly',
      now(), now() + interval '14 days', now() + interval '14 days'
    )
    RETURNING id INTO _sub_id;
  END IF;

  RETURN jsonb_build_object(
    'company_id', _company_id,
    'branch_id', _branch_id,
    'subscription_id', _sub_id,
    'trial_ends_at', now() + interval '14 days'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_tenant(text,text,text,text,text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_tenant(text,text,text,text,text,text,text,text,text,text,text) TO authenticated;
