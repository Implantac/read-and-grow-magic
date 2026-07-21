
-- Add reopen tracking fields to daily_fiscal_snapshots
ALTER TABLE public.daily_fiscal_snapshots
  ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reopened_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reopened_reason TEXT;

-- Update retroactive guards to skip reopened snapshots
CREATE OR REPLACE FUNCTION public.reopen_fiscal_day(
  _company_id UUID,
  _snapshot_date DATE,
  _reason TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user UUID := auth.uid();
  _is_admin BOOLEAN;
  _affected INT;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT (public.has_role(_user, 'admin'::app_role) OR public.has_role(_user, 'admin_matriz'::app_role))
    INTO _is_admin;

  IF NOT _is_admin THEN
    RAISE EXCEPTION 'Somente administradores podem reabrir períodos fiscais';
  END IF;

  IF _reason IS NULL OR length(trim(_reason)) < 10 THEN
    RAISE EXCEPTION 'Justificativa obrigatória (mínimo 10 caracteres)';
  END IF;

  UPDATE public.daily_fiscal_snapshots
     SET reopened_at = now(),
         reopened_by = _user,
         reopened_reason = _reason
   WHERE company_id = _company_id
     AND snapshot_date = _snapshot_date;

  GET DIAGNOSTICS _affected = ROW_COUNT;

  IF _affected = 0 THEN
    RAISE EXCEPTION 'Nenhum fechamento encontrado para % em %', _company_id, _snapshot_date;
  END IF;

  INSERT INTO public.system_audit_logs (
    company_id, user_id, action, entity_type, entity_id, metadata
  ) VALUES (
    _company_id, _user, 'FISCAL_PERIOD_REOPENED', 'daily_fiscal_snapshots',
    _snapshot_date::text,
    jsonb_build_object(
      'snapshot_date', _snapshot_date,
      'reason', _reason,
      'rows_affected', _affected,
      'reopened_at', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'snapshot_date', _snapshot_date,
    'rows_affected', _affected
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reopen_fiscal_day(UUID, DATE, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.reopen_fiscal_day(UUID, DATE, TEXT) TO authenticated;
