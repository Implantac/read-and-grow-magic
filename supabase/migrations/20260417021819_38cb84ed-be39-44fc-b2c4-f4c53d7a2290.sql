-- Restrict user_roles policies to authenticated role only (defense-in-depth)
-- The has_role() check would already deny unauthenticated requests, but applying
-- policies to {authenticated} enforces auth at the policy level.

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles'
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.user_roles TO authenticated', pol.policyname);
  END LOOP;
END $$;