
CREATE TABLE public.demo_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT,
  outcome TEXT NOT NULL,
  transcript TEXT NOT NULL,
  line_count INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','failed','aborted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.demo_runs TO anon;
GRANT SELECT ON public.demo_runs TO authenticated;
GRANT ALL ON public.demo_runs TO service_role;

ALTER TABLE public.demo_runs ENABLE ROW LEVEL SECURITY;

-- Public replay: anyone can read a run by id (no PII beyond hashed IP).
CREATE POLICY "Public can read demo runs"
  ON public.demo_runs FOR SELECT
  USING (true);

CREATE INDEX idx_demo_runs_created_at ON public.demo_runs(created_at DESC);
