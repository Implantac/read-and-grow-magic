
ALTER TABLE public.workflow_instances
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wi_company_status_due
  ON public.workflow_instances (company_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_wi_assigned
  ON public.workflow_instances (company_id, assigned_to)
  WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wt_company_created
  ON public.workflow_transitions (company_id, created_at DESC);
