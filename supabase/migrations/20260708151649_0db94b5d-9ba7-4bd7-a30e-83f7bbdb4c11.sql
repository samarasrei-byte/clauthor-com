
CREATE TABLE public.thor_greeting_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression','cta_click','dismiss')),
  usage_percentage INTEGER,
  remaining_credits INTEGER,
  level TEXT CHECK (level IN ('ok','low','critical')),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_thor_events_user ON public.thor_greeting_events(user_id, created_at DESC);
CREATE INDEX idx_thor_events_type ON public.thor_greeting_events(event_type, created_at DESC);

GRANT SELECT, INSERT ON public.thor_greeting_events TO authenticated;
GRANT ALL ON public.thor_greeting_events TO service_role;

ALTER TABLE public.thor_greeting_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own greeting events"
ON public.thor_greeting_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own greeting events"
ON public.thor_greeting_events FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all greeting events"
ON public.thor_greeting_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
