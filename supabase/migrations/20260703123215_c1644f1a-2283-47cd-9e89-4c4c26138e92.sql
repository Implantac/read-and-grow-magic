-- Force sensitive=true for credential-like system parameters to prevent
-- accidental exposure of API keys/tokens/passwords to non-admin tenants.

CREATE OR REPLACE FUNCTION public.enforce_sensitive_system_parameters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NOT NULL AND NEW.code ~* '(api[_-]?key|secret|token|password|senha|pwd|credential|private[_-]?key|access[_-]?key|client[_-]?secret|webhook[_-]?secret|bearer)' THEN
    NEW.sensitive := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_system_parameters_enforce_sensitive ON public.system_parameters;
CREATE TRIGGER trg_system_parameters_enforce_sensitive
BEFORE INSERT OR UPDATE ON public.system_parameters
FOR EACH ROW EXECUTE FUNCTION public.enforce_sensitive_system_parameters();

-- Backfill: mark existing rows whose code matches credential-like patterns.
UPDATE public.system_parameters
SET sensitive = true
WHERE sensitive = false
  AND code ~* '(api[_-]?key|secret|token|password|senha|pwd|credential|private[_-]?key|access[_-]?key|client[_-]?secret|webhook[_-]?secret|bearer)';