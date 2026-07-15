
ALTER TABLE public.plugins
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS screenshots text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS homepage_url text,
  ADD COLUMN IF NOT EXISTS min_app_version text;
