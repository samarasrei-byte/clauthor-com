
-- Drop ALL existing storage policies for knowledge-files bucket
DROP POLICY IF EXISTS "Users can upload own knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own knowledge files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own knowledge files" ON storage.objects;

-- Recreate with user-scoped path ownership
CREATE POLICY "Users can upload own knowledge files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'knowledge-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own knowledge files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'knowledge-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own knowledge files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'knowledge-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
