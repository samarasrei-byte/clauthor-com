
-- ==============================================
-- PILLAR 3: Tool-to-Tier mapping table
-- PILLAR 4: Structured execution status enum
-- ==============================================

-- Tool tier enforcement mapping
CREATE TABLE IF NOT EXISTS public.tool_tier_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name text NOT NULL UNIQUE,
  min_tier text NOT NULL DEFAULT 'basic',
  min_plan text NOT NULL DEFAULT 'free',
  monthly_limit integer DEFAULT NULL,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_tier_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tool tier requirements"
  ON public.tool_tier_requirements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view tool tier requirements"
  ON public.tool_tier_requirements FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Seed tool-tier mappings
INSERT INTO public.tool_tier_requirements (tool_name, min_tier, min_plan, monthly_limit, description) VALUES
  ('send_email',        'basic',        'free',      50,   'Envio de emails'),
  ('create_task',       'basic',        'free',      100,  'Criação de tarefas'),
  ('generate_report',   'intermediate', 'starter',   20,   'Geração de relatórios'),
  ('search_leads',      'intermediate', 'starter',   50,   'Pesquisa de leads'),
  ('schedule_meeting',  'basic',        'free',      30,   'Agendamento de reuniões'),
  ('analyze_data',      'intermediate', 'starter',   30,   'Análise de dados'),
  ('delegate_to_agent', 'advanced',     'pro',       NULL, 'Delegação entre agentes')
ON CONFLICT (tool_name) DO NOTHING;

-- Plan monthly limits table
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type text NOT NULL UNIQUE,
  max_agents integer NOT NULL DEFAULT 3,
  max_tools_per_agent integer NOT NULL DEFAULT 5,
  max_monthly_executions integer NOT NULL DEFAULT 500,
  max_squads integer NOT NULL DEFAULT 1,
  max_team_members integer NOT NULL DEFAULT 3,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage plan limits"
  ON public.plan_limits FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view plan limits"
  ON public.plan_limits FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Seed plan limits
INSERT INTO public.plan_limits (plan_type, max_agents, max_tools_per_agent, max_monthly_executions, max_squads, max_team_members) VALUES
  ('free',       3,  3,  500,   1, 3),
  ('starter',    5,  5,  2000,  2, 5),
  ('pro',       -1,  7,  10000, 5, 15),
  ('enterprise',-1, -1, -1,    -1, -1)
ON CONFLICT (plan_type) DO NOTHING;
