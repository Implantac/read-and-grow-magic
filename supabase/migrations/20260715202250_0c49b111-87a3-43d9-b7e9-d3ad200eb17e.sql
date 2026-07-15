
ALTER TABLE public.plugin_installations
  ADD COLUMN IF NOT EXISTS auto_update boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.plugin_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plugin_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plugin_reviews TO authenticated;
GRANT ALL ON public.plugin_reviews TO service_role;

ALTER TABLE public.plugin_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pr_read_all_auth" ON public.plugin_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pr_insert_own" ON public.plugin_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pr_update_own" ON public.plugin_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pr_delete_own" ON public.plugin_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_plugin_reviews_plugin ON public.plugin_reviews(plugin_id);

CREATE TRIGGER trg_plugin_reviews_updated_at BEFORE UPDATE ON public.plugin_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
