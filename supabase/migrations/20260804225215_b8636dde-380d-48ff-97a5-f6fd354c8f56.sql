-- Add branch_id to replenishment_tasks for better scoping
ALTER TABLE public.replenishment_tasks ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id);

-- Ensure RLS includes branch_id check if user is restricted to a branch
-- But for now company_id is sufficient for tenant isolation.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.replenishment_tasks TO authenticated;
GRANT ALL ON public.replenishment_tasks TO service_role;
