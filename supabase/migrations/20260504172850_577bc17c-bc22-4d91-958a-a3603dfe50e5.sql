CREATE TABLE IF NOT EXISTS public.advocacia_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  whatsapp_status text NOT NULL DEFAULT 'pending',
  whatsapp_number text,
  crm_status text NOT NULL DEFAULT 'pending',
  crm_provider text,
  clicksign_status text NOT NULL DEFAULT 'pending',
  clicksign_token text,
  oab_number text,
  office_name text,
  practice_areas text[],
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advocacia_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own onboarding" ON public.advocacia_onboarding FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own onboarding" ON public.advocacia_onboarding FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own onboarding" ON public.advocacia_onboarding FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_advocacia_onboarding_updated_at
  BEFORE UPDATE ON public.advocacia_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();