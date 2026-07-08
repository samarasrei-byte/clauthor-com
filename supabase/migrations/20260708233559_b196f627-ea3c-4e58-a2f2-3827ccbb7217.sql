ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_answers JSONB,
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;