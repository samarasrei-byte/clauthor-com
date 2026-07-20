ALTER TABLE public.company_dna
  ADD COLUMN IF NOT EXISTS intelligence jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.company_dna.intelligence IS
  'Inferência automática via Lovable AI a partir do scrape Firecrawl: {icp, tone_of_voice, persona, business_summary, differentiators, suggested_pain_points, industry_guess, confidence}';