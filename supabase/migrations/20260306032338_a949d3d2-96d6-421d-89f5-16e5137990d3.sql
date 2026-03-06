
-- Storage bucket for knowledge base files (PDFs, docs, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-files', 'knowledge-files', false);

-- RLS for knowledge files bucket
CREATE POLICY "Users can upload own knowledge files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'knowledge-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own knowledge files"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own knowledge files"
ON storage.objects FOR DELETE
USING (bucket_id = 'knowledge-files' AND auth.uid() IS NOT NULL);
