CREATE OR REPLACE FUNCTION public.cx_ensure_default_weights(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.cx_health_weights (company_id, weights)
  VALUES (
    _company_id,
    jsonb_build_object(
      'purchase_frequency', 20,
      'purchase_value', 15,
      'recency', 15,
      'nps', 20,
      'tickets', 10,
      'overdue_payments', 10,
      'returns', 5,
      'engagement', 5
    )
  )
  ON CONFLICT (company_id) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cx_ensure_default_weights(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cx_ensure_default_weights(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.fn_cx_seed_new_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.cx_ensure_default_weights(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cx_seed_new_company ON public.companies;
CREATE TRIGGER trg_cx_seed_new_company
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.fn_cx_seed_new_company();

-- Backfill existing companies without weights
INSERT INTO public.cx_health_weights (company_id, weights)
SELECT c.id, jsonb_build_object(
  'purchase_frequency', 20, 'purchase_value', 15, 'recency', 15, 'nps', 20,
  'tickets', 10, 'overdue_payments', 10, 'returns', 5, 'engagement', 5
)
FROM public.companies c
LEFT JOIN public.cx_health_weights w ON w.company_id = c.id
WHERE w.id IS NULL;