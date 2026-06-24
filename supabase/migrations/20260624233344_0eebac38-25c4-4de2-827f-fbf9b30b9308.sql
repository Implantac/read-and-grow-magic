INSERT INTO public.plan_modules (plan_id, module_key, enabled)
SELECT p.id, 'executivo', true
FROM public.plans p
WHERE p.slug IN ('profissional', 'business', 'enterprise')
ON CONFLICT (plan_id, module_key) DO UPDATE SET enabled = true;