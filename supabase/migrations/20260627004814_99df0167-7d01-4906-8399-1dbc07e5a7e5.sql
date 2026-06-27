
CREATE TABLE public.agent_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agent_id UUID,
  agent_name TEXT,
  action_type TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success','failed','blocked','pending')),
  cost_credits NUMERIC(12,4) DEFAULT 0,
  user_id UUID,
  prev_hash TEXT,
  entry_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_tenant_time ON public.agent_audit_trail(tenant_id, created_at DESC);
CREATE INDEX idx_audit_agent ON public.agent_audit_trail(agent_id);

GRANT SELECT ON public.agent_audit_trail TO authenticated;
GRANT ALL ON public.agent_audit_trail TO service_role;
ALTER TABLE public.agent_audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members read audit trail"
ON public.agent_audit_trail FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Sem policies de INSERT/UPDATE/DELETE: apenas service_role grava via função abaixo.

CREATE OR REPLACE FUNCTION public.append_audit_entry(
  _tenant_id UUID,
  _agent_id UUID,
  _agent_name TEXT,
  _action_type TEXT,
  _input JSONB,
  _output JSONB,
  _status TEXT,
  _cost NUMERIC,
  _user_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prev TEXT;
  _hash TEXT;
  _id UUID;
BEGIN
  SELECT entry_hash INTO _prev
  FROM public.agent_audit_trail
  WHERE tenant_id = _tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  _hash := encode(
    digest(
      coalesce(_prev,'') ||
      _tenant_id::text || coalesce(_agent_id::text,'') ||
      _action_type || _input::text || _output::text ||
      _status || coalesce(_cost::text,'0') || now()::text,
      'sha256'
    ),
    'hex'
  );

  INSERT INTO public.agent_audit_trail(
    tenant_id, agent_id, agent_name, action_type,
    input, output, status, cost_credits, user_id,
    prev_hash, entry_hash
  ) VALUES (
    _tenant_id, _agent_id, _agent_name, _action_type,
    _input, _output, _status, _cost, _user_id,
    _prev, _hash
  ) RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.append_audit_entry(UUID,UUID,TEXT,TEXT,JSONB,JSONB,TEXT,NUMERIC,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.append_audit_entry(UUID,UUID,TEXT,TEXT,JSONB,JSONB,TEXT,NUMERIC,UUID) TO service_role;
