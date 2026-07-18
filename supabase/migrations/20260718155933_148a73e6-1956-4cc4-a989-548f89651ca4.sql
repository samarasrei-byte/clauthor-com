
CREATE TABLE public.clipper_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('youtube','drive','direct','upload')),
  formats TEXT[] NOT NULL DEFAULT ARRAY['9:16']::TEXT[],
  hint TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','analyzing','ready','rendering','completed','failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clipper_jobs_user ON public.clipper_jobs(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clipper_jobs TO authenticated;
GRANT ALL ON public.clipper_jobs TO service_role;
ALTER TABLE public.clipper_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clipper_jobs" ON public.clipper_jobs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.clipper_clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.clipper_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_s INTEGER NOT NULL,
  end_s INTEGER NOT NULL,
  hook TEXT,
  caption TEXT,
  hashtags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  title TEXT,
  cover_url TEXT,
  rendered_urls JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','rendering','ready','posted','skipped','failed')),
  posted_to JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clipper_clips_job ON public.clipper_clips(job_id);
CREATE INDEX idx_clipper_clips_user ON public.clipper_clips(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clipper_clips TO authenticated;
GRANT ALL ON public.clipper_clips TO service_role;
ALTER TABLE public.clipper_clips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clipper_clips" ON public.clipper_clips
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tg_clipper_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER clipper_jobs_touch BEFORE UPDATE ON public.clipper_jobs
  FOR EACH ROW EXECUTE FUNCTION public.tg_clipper_touch();
CREATE TRIGGER clipper_clips_touch BEFORE UPDATE ON public.clipper_clips
  FOR EACH ROW EXECUTE FUNCTION public.tg_clipper_touch();
