
-- Table to store integration credentials per agent
CREATE TABLE public.agent_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  integration_name text NOT NULL,
  credential_key text NOT NULL,
  credential_value text NOT NULL,
  is_secret boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, integration_name, credential_key)
);

-- RLS
ALTER TABLE public.agent_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent credentials"
  ON public.agent_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent credentials"
  ON public.agent_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent credentials"
  ON public.agent_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent credentials"
  ON public.agent_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins can manage all credentials"
  ON public.agent_credentials FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated at trigger
CREATE TRIGGER update_agent_credentials_updated_at
  BEFORE UPDATE ON public.agent_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
