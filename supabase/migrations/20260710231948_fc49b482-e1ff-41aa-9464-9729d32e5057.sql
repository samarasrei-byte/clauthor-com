-- 1. Extend mcp_executions to serve as the "run" table
ALTER TABLE public.mcp_executions
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS run_type text NOT NULL DEFAULT 'mcp'
    CHECK (run_type IN ('mcp','agent_task','approval_action','agent_execute','hunter','linkedin','other')),
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS summary text;

CREATE INDEX IF NOT EXISTS mcp_executions_tenant_created_idx
  ON public.mcp_executions (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mcp_executions_user_created_idx
  ON public.mcp_executions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mcp_executions_parent_task_idx
  ON public.mcp_executions (parent_task_id);

-- 2. Create execution_steps table
CREATE TABLE IF NOT EXISTS public.execution_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.mcp_executions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  user_id uuid,
  step_index integer NOT NULL,
  agent_slug text,
  step_type text NOT NULL CHECK (step_type IN (
    'thought','tool_call','tool_result','decision','delegation','final_output','error','system'
  )),
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  tool_name text,
  sources jsonb,
  tokens_in integer DEFAULT 0,
  tokens_out integer DEFAULT 0,
  cost_credits numeric(12,4) DEFAULT 0,
  duration_ms integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS execution_steps_run_idx
  ON public.execution_steps (run_id, step_index);
CREATE INDEX IF NOT EXISTS execution_steps_tenant_created_idx
  ON public.execution_steps (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS execution_steps_agent_idx
  ON public.execution_steps (agent_slug, created_at DESC);

-- 3. GRANTs — required so PostgREST can reach the table
GRANT SELECT, INSERT ON public.execution_steps TO authenticated;
GRANT ALL ON public.execution_steps TO service_role;

-- 4. RLS
ALTER TABLE public.execution_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view execution steps"
  ON public.execution_steps
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Tenant members can insert execution steps"
  ON public.execution_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_tenant_member(auth.uid(), tenant_id)
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.execution_steps;
ALTER TABLE public.execution_steps REPLICA IDENTITY FULL;