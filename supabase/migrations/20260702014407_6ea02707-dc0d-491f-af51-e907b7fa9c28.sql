DROP POLICY IF EXISTS "Avatars: public read individual files" ON storage.objects;

CREATE POLICY "Avatars: authenticated read own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

REVOKE EXECUTE ON FUNCTION public.check_atp(uuid, numeric, date) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_credit(uuid, numeric) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_sales_audit() FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.check_atp(uuid, numeric, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_credit(uuid, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_sales_audit() TO service_role;