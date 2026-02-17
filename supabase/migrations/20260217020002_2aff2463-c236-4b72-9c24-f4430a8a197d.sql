
-- Create agent_templates table for the 12 catalog agents with pre-built prompts
CREATE TABLE public.agent_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL DEFAULT 'basic',
  instructions TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  default_integrations JSONB DEFAULT '[]'::jsonb,
  default_channels JSONB DEFAULT '[]'::jsonb,
  default_actions JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}'::text[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view active templates (public catalog)
CREATE POLICY "Anyone can view active templates"
  ON public.agent_templates FOR SELECT
  USING (is_active = true);

-- Admins can manage templates
CREATE POLICY "Admins can manage templates"
  ON public.agent_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_agent_templates_updated_at
  BEFORE UPDATE ON public.agent_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
