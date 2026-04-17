
-- Replace permissive realtime topic policies with company-scoped patterns
DROP POLICY IF EXISTS "Authenticated can publish scoped realtime topics" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can read scoped realtime topics" ON realtime.messages;

-- SELECT (subscribe): own company channel, own user channel, or admin global channel
CREATE POLICY "Authenticated can read company-scoped realtime topics"
ON realtime.messages
FOR SELECT TO authenticated
USING (
  realtime.topic() LIKE ('company:' || COALESCE(public.get_user_company_id(auth.uid())::text, '__none__') || ':%')
  OR realtime.topic() LIKE ('user:' || (auth.uid())::text || ':%')
  OR realtime.topic() = ('user:' || (auth.uid())::text)
  OR (public.has_role(auth.uid(), 'admin') AND realtime.topic() LIKE 'admin:%')
);

-- INSERT (publish): same scoping rules
CREATE POLICY "Authenticated can publish company-scoped realtime topics"
ON realtime.messages
FOR INSERT TO authenticated
WITH CHECK (
  realtime.topic() LIKE ('company:' || COALESCE(public.get_user_company_id(auth.uid())::text, '__none__') || ':%')
  OR realtime.topic() LIKE ('user:' || (auth.uid())::text || ':%')
  OR realtime.topic() = ('user:' || (auth.uid())::text)
  OR (public.has_role(auth.uid(), 'admin') AND realtime.topic() LIKE 'admin:%')
);
