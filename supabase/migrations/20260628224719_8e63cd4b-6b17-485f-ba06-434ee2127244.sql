
-- Marketplace v3: plugin sandbox + per-tenant quotas
ALTER TABLE public.plugins
  ADD COLUMN IF NOT EXISTS sandbox_script text,
  ADD COLUMN IF NOT EXISTS manifest jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.plugin_installations
  ADD COLUMN IF NOT EXISTS quota_per_day integer NOT NULL DEFAULT 1000;

-- Quota check: count today's successful + errored executions for an installation
CREATE OR REPLACE FUNCTION public.plugin_quota_remaining(_installation_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    0,
    COALESCE((SELECT quota_per_day FROM public.plugin_installations WHERE id = _installation_id), 0)
    - COALESCE((
        SELECT count(*)::int FROM public.plugin_executions
        WHERE installation_id = _installation_id
          AND created_at >= date_trunc('day', now())
      ), 0)
  );
$$;

REVOKE ALL ON FUNCTION public.plugin_quota_remaining(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.plugin_quota_remaining(uuid) TO authenticated, service_role;
