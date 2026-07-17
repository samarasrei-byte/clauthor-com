ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS walkthrough_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pain_raw TEXT;