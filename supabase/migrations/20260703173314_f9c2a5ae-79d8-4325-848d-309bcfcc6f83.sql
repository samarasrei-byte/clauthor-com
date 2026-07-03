
CREATE TABLE IF NOT EXISTS public.linkedin_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linkedin_urn text NOT NULL,
  content text NOT NULL,
  link_url text,
  visibility text NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC','CONNECTIONS')),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','failed','deleted')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_user ON public.linkedin_posts(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_posts TO authenticated;
GRANT ALL ON public.linkedin_posts TO service_role;
ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "linkedin_posts_own_select" ON public.linkedin_posts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "linkedin_posts_own_insert" ON public.linkedin_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "linkedin_posts_own_update" ON public.linkedin_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "linkedin_posts_own_delete" ON public.linkedin_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
