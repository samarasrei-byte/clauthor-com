-- Sessões do Thor Concierge (contexto do funil de contratação)
CREATE TABLE public.thor_concierge_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  empresa TEXT,
  empresa_url TEXT,
  industry TEXT,
  dor TEXT,
  icp TEXT,
  dept_id TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_thor_concierge_session_id ON public.thor_concierge_sessions (session_id);
CREATE INDEX idx_thor_concierge_user_id ON public.thor_concierge_sessions (user_id);
CREATE INDEX idx_thor_concierge_created_at ON public.thor_concierge_sessions (created_at DESC);

GRANT ALL ON public.thor_concierge_sessions TO service_role;
-- No anon/authenticated grants: a edge function (service_role) é a única
-- superfície de leitura/gravação. RLS permanece ligada para bloquear PostgREST.
ALTER TABLE public.thor_concierge_sessions ENABLE ROW LEVEL SECURITY;

-- Trigger genérico de updated_at (reaproveita função se existir, senão cria)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_thor_concierge_sessions_updated_at
  BEFORE UPDATE ON public.thor_concierge_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Permite inserção pública de eventos de KPI (funil de conversão anônimo).
-- A tabela kpi_events já existe com RLS ligada e política SELECT para admins.
GRANT INSERT ON public.kpi_events TO anon, authenticated;

CREATE POLICY "Anyone can insert kpi events"
  ON public.kpi_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);