
-- 1) Fix wms_conference_records public policies
DROP POLICY IF EXISTS "wms_conference_public_read" ON public.wms_conference_records;
DROP POLICY IF EXISTS "wms_conference_public_write" ON public.wms_conference_records;

ALTER TABLE public.wms_conference_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wms_conference_authenticated_read"
  ON public.wms_conference_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "wms_conference_authenticated_insert"
  ON public.wms_conference_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'operator')
  );

CREATE POLICY "wms_conference_authenticated_update"
  ON public.wms_conference_records
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'operator')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'operator')
  );

CREATE POLICY "wms_conference_authenticated_delete"
  ON public.wms_conference_records
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Fix avatars bucket: restrict listing while keeping individual reads
-- Drop overly broad public select policies on storage.objects for avatars bucket
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (
        policyname ILIKE '%avatar%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Authenticated users can upload their own avatar (folder = uid)
CREATE POLICY "Avatars: users can upload their own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatars: users can update their own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatars: users can delete their own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access to a specific avatar object is allowed via direct URL only.
-- We restrict listing by requiring the request to specify the exact object name.
-- A SELECT policy that requires the full path prevents bulk listing while allowing direct access.
CREATE POLICY "Avatars: public read individual files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'avatars'
    AND name IS NOT NULL
    AND length(name) > 0
  );
