
CREATE TABLE public.agent_traces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  agent_name TEXT,
  run_id UUID NOT NULL DEFAULT gen_random_uuid(),
  parent_span_id UUID,
  span_type TEXT NOT NULL CHECK (span_type IN ('run','llm_call','tool_call','retrieval','decision','error')),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','error','pending')),
  model TEXT,
  input JSONB,
  output JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  eval_score NUMERIC(4,2),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_traces_user ON public.agent_traces(user_id, created_at DESC);
CREATE INDEX idx_agent_traces_agent ON public.agent_traces(agent_id, created_at DESC);
CREATE INDEX idx_agent_traces_run ON public.agent_traces(run_id, started_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_traces TO authenticated;
GRANT ALL ON public.agent_traces TO service_role;

ALTER TABLE public.agent_traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own traces"
  ON public.agent_traces FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own traces"
  ON public.agent_traces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON public.agent_traces FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
