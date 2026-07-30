UPDATE public.plans p
SET allowed_modules = (
  SELECT array_agg(DISTINCT m ORDER BY m)
  FROM (
    SELECT unnest(p.allowed_modules) AS m
    UNION
    SELECT pm.module_key FROM public.plan_modules pm WHERE pm.plan_id = p.id AND pm.enabled
  ) s
)
WHERE EXISTS (
  SELECT 1 FROM public.plan_modules pm
  WHERE pm.plan_id = p.id AND pm.enabled AND NOT (pm.module_key = ANY(p.allowed_modules))
);