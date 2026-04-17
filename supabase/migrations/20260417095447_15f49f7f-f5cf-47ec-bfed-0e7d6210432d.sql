
ALTER TABLE public.hunter_linkedin_session
  ADD COLUMN IF NOT EXISTS access_token text DEFAULT '',
  ADD COLUMN IF NOT EXISTS refresh_token text DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin_user_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.hunter_linkedin_session
  ALTER COLUMN linkedin_cookie SET DEFAULT '';
