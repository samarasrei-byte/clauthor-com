
-- Pending actions table: stores actions awaiting user approval
CREATE TABLE public.pending_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  risk_level text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  decided_at timestamp with time zone,
  decided_by uuid,
  rejection_reason text,
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own pending actions"
  ON public.pending_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pending actions"
  ON public.pending_actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert pending actions"
  ON public.pending_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all pending actions"
  ON public.pending_actions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for instant notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_actions;

-- Auto-update trigger
CREATE TRIGGER update_pending_actions_updated_at
  BEFORE UPDATE ON public.pending_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
