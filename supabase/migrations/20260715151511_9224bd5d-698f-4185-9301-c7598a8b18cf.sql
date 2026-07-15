-- Storage policies for `videos` bucket (private).
-- File path: {tenant_id}/{generation_id}.{ext}
-- first folder segment = tenant_id

CREATE POLICY "Tenant members can read own videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND public.is_tenant_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Tenant members can upload own videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'videos'
    AND public.is_tenant_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Tenant members can update own videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND public.is_tenant_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Tenant members can delete own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND public.is_tenant_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
