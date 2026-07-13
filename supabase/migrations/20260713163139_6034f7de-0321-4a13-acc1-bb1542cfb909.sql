-- 1. CREATE TABLE
CREATE TABLE public.thor_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  facts JSONB NOT NULL DEFAULT '{}'::jsonb,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT thor_memory_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE UNIQUE INDEX thor_memory_user_id_key ON public.thor_memory (user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX thor_memory_session_id_key ON public.thor_memory (session_id) WHERE user_id IS NULL AND session_id IS NOT NULL;
CREATE INDEX thor_memory_updated_at_idx ON public.thor_memory (updated_at DESC);

-- 2. GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thor_memory TO authenticated;
GRANT ALL ON public.thor_memory TO service_role;

-- 3. RLS
ALTER TABLE public.thor_memory ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
CREATE POLICY "Users can view own thor memory"
  ON public.thor_memory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own thor memory"
  ON public.thor_memory FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thor memory"
  ON public.thor_memory FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own thor memory"
  ON public.thor_memory FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. updated_at trigger (reuse existing function if present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SET search_path = public
    AS $fn$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $fn$;
  END IF;
END $$;

CREATE TRIGGER update_thor_memory_updated_at
  BEFORE UPDATE ON public.thor_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();