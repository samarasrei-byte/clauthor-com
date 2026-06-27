
CREATE TABLE public.agent_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID,
  agent_name TEXT,
  message_id TEXT,
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
  comment TEXT,
  user_message TEXT,
  assistant_message TEXT,
  applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_feedback_tenant_agent ON public.agent_feedback(tenant_id, agent_id);

GRANT SELECT, INSERT, UPDATE ON public.agent_feedback TO authenticated;
GRANT ALL ON public.agent_feedback TO service_role;
ALTER TABLE public.agent_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own feedback in tenant"
ON public.agent_feedback FOR ALL
USING (user_id = auth.uid() AND tenant_id = public.get_user_tenant_id(auth.uid()))
WITH CHECK (user_id = auth.uid() AND tenant_id = public.get_user_tenant_id(auth.uid()));
