
-- Track OpenClaw agent registrations and status
CREATE TABLE public.openclaw_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  openclaw_agent_id TEXT, -- ID returned by OpenClaw API
  status TEXT NOT NULL DEFAULT 'pending', -- pending, registered, active, error
  webhook_url TEXT,
  last_webhook_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_openclaw_registrations_agent ON public.openclaw_registrations(agent_id);
CREATE INDEX idx_openclaw_registrations_user ON public.openclaw_registrations(user_id);
CREATE INDEX idx_openclaw_registrations_status ON public.openclaw_registrations(status);

-- Enable RLS
ALTER TABLE public.openclaw_registrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own registrations"
ON public.openclaw_registrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own registrations"
ON public.openclaw_registrations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations"
ON public.openclaw_registrations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all registrations"
ON public.openclaw_registrations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role policy for webhook updates (no auth context)
CREATE POLICY "Service can update registrations"
ON public.openclaw_registrations FOR UPDATE
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_openclaw_registrations_updated_at
BEFORE UPDATE ON public.openclaw_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
