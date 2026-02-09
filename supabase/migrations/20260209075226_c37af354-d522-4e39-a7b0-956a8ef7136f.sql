-- Tabela de créditos dos usuários
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_credits INTEGER NOT NULL DEFAULT 10000,
  used_credits INTEGER NOT NULL DEFAULT 0,
  plan_type TEXT NOT NULL DEFAULT 'free',
  credits_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de uso de tokens
CREATE TABLE public.token_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  tokens_used INTEGER NOT NULL,
  model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  action_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Planos disponíveis com créditos
CREATE TABLE public.credit_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  monthly_credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies para user_credits
CREATE POLICY "Users can view own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert credits"
  ON public.user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all credits"
  ON public.user_credits FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para token_usage
CREATE POLICY "Users can view own usage"
  ON public.token_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.token_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage"
  ON public.token_usage FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para credit_plans (público para leitura)
CREATE POLICY "Anyone can view plans"
  ON public.credit_plans FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage plans"
  ON public.credit_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar créditos quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, total_credits, plan_type)
  VALUES (NEW.id, 10000, 'free');
  RETURN NEW;
END;
$$;

-- Trigger para criar créditos automaticamente
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_credits();

-- Inserir planos padrão
INSERT INTO public.credit_plans (name, monthly_credits, price_cents, features) VALUES
  ('free', 10000, 0, '["10k tokens/mês", "1 agente", "Suporte por email"]'::jsonb),
  ('starter', 50000, 9900, '["50k tokens/mês", "3 agentes", "Suporte prioritário"]'::jsonb),
  ('pro', 200000, 29900, '["200k tokens/mês", "10 agentes", "Suporte 24/7", "API access"]'::jsonb),
  ('enterprise', 1000000, 99900, '["1M tokens/mês", "Agentes ilimitados", "Suporte dedicado", "SLA 99.9%"]'::jsonb);