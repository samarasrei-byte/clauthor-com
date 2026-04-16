-- Add fields needed for Hunter v2 (4-step flow)
ALTER TABLE public.hunter_campaigns
  ADD COLUMN IF NOT EXISTS message_template TEXT NOT NULL DEFAULT 'Olá {{primeiro_nome}}, vi seu perfil e gostaria de conectar.',
  ADD COLUMN IF NOT EXISTS daily_schedule TIME NOT NULL DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;

-- Table to store LinkedIn OAuth/session per user
CREATE TABLE IF NOT EXISTS public.hunter_linkedin_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  linkedin_cookie TEXT NOT NULL DEFAULT '',
  profile_name TEXT NOT NULL DEFAULT '',
  profile_avatar_url TEXT NOT NULL DEFAULT '',
  profile_url TEXT NOT NULL DEFAULT '',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hunter_linkedin_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own linkedin session"
  ON public.hunter_linkedin_session FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all linkedin sessions"
  ON public.hunter_linkedin_session FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_hunter_linkedin_session_updated_at
  BEFORE UPDATE ON public.hunter_linkedin_session
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable pg_cron + pg_net for daily 9am scheduler
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;