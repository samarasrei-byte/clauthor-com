
-- ══════════════════════════════════════════════════════════
-- HARDENING: Credential Audit Logs, Tools Registry, Agent-Level RLS
-- ══════════════════════════════════════════════════════════

-- 1. Credential Audit Logs (quem acessou o quê)
CREATE TABLE IF NOT EXISTS public.credential_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  integration_name text NOT NULL,
  credential_key text NOT NULL,
  action text NOT NULL DEFAULT 'access',
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credential_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON public.credential_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON public.credential_audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
  ON public.credential_audit_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_credential_audit_user_agent 
  ON public.credential_audit_logs(user_id, agent_id, created_at DESC);

-- 2. Tools Registry (catálogo de ferramentas disponíveis)
CREATE TABLE IF NOT EXISTS public.tools (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  requires_credential boolean NOT NULL DEFAULT false,
  credential_fields jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view tools"
  ON public.tools FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage tools"
  ON public.tools FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Agent-Tool binding (isolamento agente↔ferramenta)
CREATE TABLE IF NOT EXISTS public.agent_tools (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, tool_id)
);

ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own agent tools"
  ON public.agent_tools FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all agent tools"
  ON public.agent_tools FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Add expires_at to agent_credentials for token expiration
ALTER TABLE public.agent_credentials 
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_count integer NOT NULL DEFAULT 0;

-- 5. Seed the tools registry with built-in tools
INSERT INTO public.tools (name, display_name, description, category, requires_credential, credential_fields) VALUES
  ('send_email', 'Enviar Email', 'Envia emails para destinatários', 'communication', true, '[{"key":"smtp_host","label":"SMTP Host"},{"key":"smtp_api_key","label":"API Key","secret":true}]'),
  ('create_task', 'Criar Tarefa', 'Cria tarefas e atividades', 'productivity', false, '[]'),
  ('generate_report', 'Gerar Relatório', 'Gera relatórios estruturados', 'analytics', false, '[]'),
  ('search_leads', 'Buscar Leads', 'Pesquisa e qualifica leads', 'sales', true, '[{"key":"crm_api_key","label":"CRM API Key","secret":true}]'),
  ('schedule_meeting', 'Agendar Reunião', 'Agenda reuniões e compromissos', 'productivity', true, '[{"key":"calendar_token","label":"Calendar Token","secret":true}]'),
  ('analyze_data', 'Analisar Dados', 'Analisa dados e gera insights', 'analytics', false, '[]'),
  ('delegate_to_agent', 'Delegar para Agente', 'Delega tarefa para outro agente', 'orchestration', false, '[]')
ON CONFLICT (name) DO NOTHING;

-- 6. Trigger to update updated_at on tools
CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_tools_updated_at
  BEFORE UPDATE ON public.agent_tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
