-- Drop existing public policies on warehouses
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='warehouses' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.warehouses', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- Read: authenticated users
CREATE POLICY "Authenticated can view warehouses"
ON public.warehouses FOR SELECT
TO authenticated
USING (true);

-- Insert: admin or manager
CREATE POLICY "Admins and managers can insert warehouses"
ON public.warehouses FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
);

-- Update: admin or manager
CREATE POLICY "Admins and managers can update warehouses"
ON public.warehouses FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
);

-- Delete: admin only
CREATE POLICY "Admins can delete warehouses"
ON public.warehouses FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));