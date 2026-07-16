
CREATE TABLE public.company_dna (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'own' CHECK (scope IN ('own','client')),
  client_label TEXT,
  source_url TEXT,
  brand_colors JSONB NOT NULL DEFAULT '{}'::jsonb,
  fonts JSONB NOT NULL DEFAULT '[]'::jsonb,
  logo_url TEXT,
  favicon_url TEXT,
  core_business TEXT,
  pain_points TEXT[] NOT NULL DEFAULT '{}',
  industry TEXT,
  raw_scrape JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_dna_user ON public.company_dna(user_id);
CREATE INDEX idx_company_dna_user_scope ON public.company_dna(user_id, scope);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_dna TO authenticated;
GRANT ALL ON public.company_dna TO service_role;

ALTER TABLE public.company_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own company_dna"
  ON public.company_dna FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own company_dna"
  ON public.company_dna FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own company_dna"
  ON public.company_dna FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own company_dna"
  ON public.company_dna FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_company_dna_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_company_dna_updated_at
  BEFORE UPDATE ON public.company_dna
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_dna_updated_at();
