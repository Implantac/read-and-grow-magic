
-- Plugin versioning: immutable snapshots per version, optional pinning per installation
CREATE TABLE IF NOT EXISTS public.plugin_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  version text NOT NULL,
  sandbox_script text,
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  changelog text,
  published_by uuid REFERENCES auth.users(id),
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plugin_id, version)
);

GRANT SELECT ON public.plugin_versions TO authenticated;
GRANT ALL ON public.plugin_versions TO service_role;

ALTER TABLE public.plugin_versions ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read versions of published plugins (marketplace transparency)
CREATE POLICY "plugin_versions_read_published"
ON public.plugin_versions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.plugins p
  WHERE p.id = plugin_versions.plugin_id AND p.is_published = true
));

-- Platform admins read & write all
CREATE POLICY "plugin_versions_system_admin_all"
ON public.plugin_versions FOR ALL TO authenticated
USING (public.is_system_admin(auth.uid()))
WITH CHECK (public.is_system_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_plugin_versions_plugin ON public.plugin_versions(plugin_id, published_at DESC);

-- Allow tenants to pin a specific version per installation (null = follow latest published)
ALTER TABLE public.plugin_installations
  ADD COLUMN IF NOT EXISTS pinned_version text;
