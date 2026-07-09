
-- Policies for storage.objects on bucket fiscal-certs. Path convention: {company_id}/{filename}
CREATE POLICY "fiscal_certs_admin_manager_all"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'fiscal-certs'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
    AND (storage.foldername(name))[1] IN (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'fiscal-certs'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
    AND (storage.foldername(name))[1] IN (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
  );
