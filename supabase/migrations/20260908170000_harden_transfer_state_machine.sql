-- Enforce transfer state transitions and keep stock movements ordered.
CREATE OR REPLACE FUNCTION public.fn_transferencia_canal_validate_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'pendente' AND NEW.status IN ('em_transito', 'cancelado') THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'em_transito' AND NEW.status IN ('recebido', 'cancelado') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Transição de transferência inválida: % -> %', OLD.status, NEW.status
    USING ERRCODE = 'P0001';
END;
$$;

REVOKE ALL ON FUNCTION public.fn_transferencia_canal_validate_transition() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_transferencia_canal_validate ON public.transferencias_canal;
CREATE TRIGGER trg_transferencia_canal_validate
BEFORE UPDATE ON public.transferencias_canal
FOR EACH ROW
EXECUTE FUNCTION public.fn_transferencia_canal_validate_transition();

CREATE OR REPLACE FUNCTION public.advance_transferencia_canal(
  p_transferencia_id uuid,
  p_status text
)
RETURNS public.transferencias_canal
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transferencia public.transferencias_canal;
BEGIN
  SELECT * INTO v_transferencia
  FROM public.transferencias_canal
  WHERE id = p_transferencia_id
    AND company_id = public.get_user_company_id(auth.uid())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transferência não encontrada ou sem acesso';
  END IF;

  IF p_status NOT IN ('recebido', 'cancelado') THEN
    RAISE EXCEPTION 'Status de destino não permitido: %', p_status;
  END IF;

  IF p_status = 'recebido' AND v_transferencia.status = 'pendente' THEN
    UPDATE public.transferencias_canal
    SET status = 'em_transito'
    WHERE id = p_transferencia_id;
  END IF;

  UPDATE public.transferencias_canal
  SET status = p_status,
      confirmed_by = CASE WHEN p_status = 'recebido' THEN auth.uid() ELSE confirmed_by END
  WHERE id = p_transferencia_id
  RETURNING * INTO v_transferencia;

  RETURN v_transferencia;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_transferencia_canal(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.advance_transferencia_canal(uuid, text) TO authenticated, service_role;