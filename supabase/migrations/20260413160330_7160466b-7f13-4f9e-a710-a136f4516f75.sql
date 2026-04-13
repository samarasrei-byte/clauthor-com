
-- Hunter Campaigns
CREATE TABLE public.hunter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  publico_alvo text NOT NULL DEFAULT '',
  cargo_alvo text NOT NULL DEFAULT '',
  setor_alvo text NOT NULL DEFAULT '',
  localizacao_alvo text NOT NULL DEFAULT '',
  linkedin_cookie_encrypted text NOT NULL DEFAULT '',
  limite_diario integer NOT NULL DEFAULT 20,
  status text NOT NULL DEFAULT 'rascunho',
  total_leads integer NOT NULL DEFAULT 0,
  total_conectados integer NOT NULL DEFAULT 0,
  total_responderam integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hunter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hunter_campaigns" ON public.hunter_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hunter_campaigns" ON public.hunter_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hunter_campaigns" ON public.hunter_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own hunter_campaigns" ON public.hunter_campaigns FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all hunter_campaigns" ON public.hunter_campaigns FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_hunter_campaigns_updated_at BEFORE UPDATE ON public.hunter_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Hunter Leads
CREATE TABLE public.hunter_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.hunter_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  nome_completo text NOT NULL DEFAULT '',
  cargo text NOT NULL DEFAULT '',
  empresa text NOT NULL DEFAULT '',
  linkedin_url text NOT NULL DEFAULT '',
  icebreaker text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'novo',
  notas text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hunter_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hunter_leads" ON public.hunter_leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hunter_leads" ON public.hunter_leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hunter_leads" ON public.hunter_leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own hunter_leads" ON public.hunter_leads FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all hunter_leads" ON public.hunter_leads FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_hunter_leads_updated_at BEFORE UPDATE ON public.hunter_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_hunter_leads_campaign ON public.hunter_leads(campaign_id);
CREATE INDEX idx_hunter_leads_status ON public.hunter_leads(status);

-- Hunter Messages
CREATE TABLE public.hunter_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.hunter_leads(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.hunter_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'nota_conexao',
  conteudo text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hunter_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hunter_messages" ON public.hunter_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hunter_messages" ON public.hunter_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hunter_messages" ON public.hunter_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own hunter_messages" ON public.hunter_messages FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all hunter_messages" ON public.hunter_messages FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Hunter Templates
CREATE TABLE public.hunter_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'nota_conexao',
  conteudo text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hunter_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hunter_templates" ON public.hunter_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hunter_templates" ON public.hunter_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hunter_templates" ON public.hunter_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own hunter_templates" ON public.hunter_templates FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all hunter_templates" ON public.hunter_templates FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Hunter Logs
CREATE TABLE public.hunter_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.hunter_campaigns(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'info',
  mensagem text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hunter_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hunter_logs" ON public.hunter_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hunter_logs" ON public.hunter_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all hunter_logs" ON public.hunter_logs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Hunter Config
CREATE TABLE public.hunter_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  phantombuster_api_key_encrypted text NOT NULL DEFAULT '',
  phantombuster_search_agent_id text NOT NULL DEFAULT '',
  phantombuster_connect_agent_id text NOT NULL DEFAULT '',
  evolution_url text NOT NULL DEFAULT '',
  evolution_instance text NOT NULL DEFAULT '',
  evolution_notify_number text NOT NULL DEFAULT '',
  evolution_api_key_encrypted text NOT NULL DEFAULT '',
  bot_last_run timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hunter_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hunter_config" ON public.hunter_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hunter_config" ON public.hunter_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hunter_config" ON public.hunter_config FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all hunter_config" ON public.hunter_config FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_hunter_config_updated_at BEFORE UPDATE ON public.hunter_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
