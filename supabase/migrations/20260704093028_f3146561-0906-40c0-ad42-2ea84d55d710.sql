
CREATE TABLE public.simulation_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_slug TEXT NOT NULL,
  period TEXT NOT NULL,
  analysis JSONB NOT NULL,
  sample_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_slug, period)
);

CREATE INDEX idx_simulation_insights_lookup ON public.simulation_insights(agent_slug, period);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulation_insights TO authenticated;
GRANT ALL ON public.simulation_insights TO service_role;

ALTER TABLE public.simulation_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage insights"
  ON public.simulation_insights FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_simulation_insights_updated_at
  BEFORE UPDATE ON public.simulation_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
