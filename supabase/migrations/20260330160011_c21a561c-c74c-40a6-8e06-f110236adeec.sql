
-- Add UPDATE policy for knowledge-files storage bucket
CREATE POLICY "Users can update own knowledge files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'knowledge-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
