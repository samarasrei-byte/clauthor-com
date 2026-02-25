
-- Update plan_limits with real governance data (upsert via delete+insert)
DELETE FROM public.plan_limits WHERE plan_type IN ('free', 'starter', 'pro', 'enterprise');

INSERT INTO public.plan_limits (plan_type, max_agents, max_monthly_executions, max_squads, max_team_members, max_tools_per_agent, features)
VALUES
  ('free', 3, 500, 1, 1, 3, '["basic_chat", "company_board"]'::jsonb),
  ('starter', 10, 5000, 3, 5, 7, '["basic_chat", "company_board", "tool_use", "reports"]'::jsonb),
  ('pro', 25, 25000, 10, 15, 15, '["basic_chat", "company_board", "tool_use", "reports", "delegation", "squads", "analytics"]'::jsonb),
  ('enterprise', -1, -1, -1, -1, -1, '["all"]'::jsonb);

-- Seed tool_tier_requirements (delete existing + fresh insert)
DELETE FROM public.tool_tier_requirements WHERE tool_name IN ('send_email', 'create_task', 'generate_report', 'search_leads', 'schedule_meeting', 'analyze_data', 'delegate_to_agent');

INSERT INTO public.tool_tier_requirements (tool_name, min_tier, min_plan, monthly_limit, description)
VALUES
  ('send_email', 'basic', 'starter', 100, 'Enviar emails via agente'),
  ('create_task', 'basic', 'free', 500, 'Criar tarefas no banco de dados'),
  ('generate_report', 'intermediate', 'starter', 50, 'Gerar relatórios estruturados'),
  ('search_leads', 'intermediate', 'starter', 200, 'Pesquisar e qualificar leads'),
  ('schedule_meeting', 'basic', 'starter', 100, 'Agendar reuniões'),
  ('analyze_data', 'intermediate', 'pro', 100, 'Análise avançada de dados'),
  ('delegate_to_agent', 'advanced', 'pro', 50, 'Delegação agent-to-agent');
