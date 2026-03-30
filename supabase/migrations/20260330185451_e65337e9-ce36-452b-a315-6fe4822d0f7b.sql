
CREATE TABLE public.agent_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  action_type text NOT NULL DEFAULT 'task',
  action_description text NOT NULL DEFAULT '',
  model_used text DEFAULT 'unknown',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs"
  ON public.agent_activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON public.agent_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all activity logs"
  ON public.agent_activity_log FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_agent_activity_log_agent_id ON public.agent_activity_log(agent_id);
CREATE INDEX idx_agent_activity_log_user_id ON public.agent_activity_log(user_id);
CREATE INDEX idx_agent_activity_log_created_at ON public.agent_activity_log(created_at DESC);
