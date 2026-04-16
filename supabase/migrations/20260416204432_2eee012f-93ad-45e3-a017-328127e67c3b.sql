
-- Drop all existing policies on suppliers
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='suppliers' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.suppliers', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user
CREATE POLICY "Authenticated can view suppliers"
ON public.suppliers FOR SELECT
TO authenticated
USING (true);

-- Insert: admin or manager only
CREATE POLICY "Admins and managers can insert suppliers"
ON public.suppliers FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
);

-- Update: admin or manager only
CREATE POLICY "Admins and managers can update suppliers"
ON public.suppliers FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
);

-- Delete: admin only
CREATE POLICY "Admins can delete suppliers"
ON public.suppliers FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
