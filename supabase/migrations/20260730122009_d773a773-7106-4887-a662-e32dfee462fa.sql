-- 1. Restrict direct table reads to the review author only
DROP POLICY IF EXISTS "pr_read_all_auth" ON public.plugin_reviews;
CREATE POLICY "pr_read_own" ON public.plugin_reviews
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Anonymized reviews for a plugin (no user_id exposed)
CREATE OR REPLACE FUNCTION public.get_plugin_reviews(p_plugin_id uuid)
RETURNS TABLE (
  id uuid,
  plugin_id uuid,
  rating smallint,
  comment text,
  created_at timestamptz,
  updated_at timestamptz,
  is_mine boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.plugin_id, r.rating, r.comment, r.created_at, r.updated_at,
         (r.user_id = auth.uid()) AS is_mine
  FROM public.plugin_reviews r
  WHERE auth.uid() IS NOT NULL
    AND r.plugin_id = p_plugin_id
  ORDER BY r.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.get_plugin_reviews(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_plugin_reviews(uuid) TO authenticated;

-- 3. Aggregated ratings per plugin (no per-user rows exposed)
CREATE OR REPLACE FUNCTION public.get_plugin_rating_summary()
RETURNS TABLE (
  plugin_id uuid,
  avg_rating numeric,
  review_count bigint,
  r1 bigint,
  r2 bigint,
  r3 bigint,
  r4 bigint,
  r5 bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.plugin_id,
         ROUND(AVG(r.rating)::numeric, 2),
         COUNT(*),
         COUNT(*) FILTER (WHERE r.rating = 1),
         COUNT(*) FILTER (WHERE r.rating = 2),
         COUNT(*) FILTER (WHERE r.rating = 3),
         COUNT(*) FILTER (WHERE r.rating = 4),
         COUNT(*) FILTER (WHERE r.rating = 5)
  FROM public.plugin_reviews r
  WHERE auth.uid() IS NOT NULL
  GROUP BY r.plugin_id
$$;

REVOKE ALL ON FUNCTION public.get_plugin_rating_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_plugin_rating_summary() TO authenticated;