DELETE FROM public.system_audit_logs WHERE company_id IS NULL;
ALTER TABLE public.system_audit_logs ALTER COLUMN company_id SET NOT NULL;