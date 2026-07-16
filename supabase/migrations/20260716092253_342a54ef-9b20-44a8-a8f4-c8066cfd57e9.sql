CREATE TABLE public.ttfo_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID,
  prompt TEXT NOT NULL,
  routed_department TEXT,
  routed_need_type TEXT CHECK (routed_need_type IN ('agent','squad','department')),
  routed_recommendation TEXT,
  ttfo_ms INTEGER,
  ttfa_ms INTEGER,
  output_preview TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ttfo_events_user ON public.ttfo_events(user_id, created_at DESC);
CREATE INDEX idx_ttfo_events_tenant ON public.ttfo_events(tenant_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.ttfo_events TO authenticated;
GRANT ALL ON public.ttfo_events TO service_role;

ALTER TABLE public.ttfo_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read their own ttfo events"
  ON public.ttfo_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users insert their own ttfo events"
  ON public.ttfo_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update their own ttfo events"
  ON public.ttfo_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);