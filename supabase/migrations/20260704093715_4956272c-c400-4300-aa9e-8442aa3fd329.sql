
CREATE TABLE public.agent_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_slug TEXT NOT NULL,
  version INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  instructions TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_slug, version)
);
CREATE INDEX idx_agent_prompt_versions_slug ON public.agent_prompt_versions(agent_slug, version DESC);

GRANT SELECT, INSERT ON public.agent_prompt_versions TO authenticated;
GRANT ALL ON public.agent_prompt_versions TO service_role;

ALTER TABLE public.agent_prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view prompt versions"
  ON public.agent_prompt_versions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert prompt versions"
  ON public.agent_prompt_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
