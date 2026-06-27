
CREATE TABLE IF NOT EXISTS public.plugin_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  installation_id uuid REFERENCES public.plugin_installations(id) ON DELETE SET NULL,
  action text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','error')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  error_message text,
  executed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.plugin_executions TO authenticated;
GRANT ALL ON public.plugin_executions TO service_role;

ALTER TABLE public.plugin_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pexec_select_tenant" ON public.plugin_executions
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "pexec_insert_tenant" ON public.plugin_executions
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_plugin_executions_company_created
  ON public.plugin_executions(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plugin_executions_plugin
  ON public.plugin_executions(plugin_id);
