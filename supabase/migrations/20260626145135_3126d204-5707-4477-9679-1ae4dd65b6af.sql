DELETE FROM public.ai_learning WHERE company_id IS NULL;

ALTER TABLE public.ai_learning
  DROP CONSTRAINT IF EXISTS ai_learning_pattern_type_pattern_key_key;

ALTER TABLE public.ai_learning
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.ai_learning
  ADD CONSTRAINT ai_learning_company_pattern_unique
  UNIQUE (company_id, pattern_type, pattern_key);