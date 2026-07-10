
CREATE TABLE public.contracted_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  department_id TEXT NOT NULL,
  department_name TEXT NOT NULL,
  department_icon TEXT,
  monthly_price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  agent_count INTEGER NOT NULL DEFAULT 0,
  agent_ids UUID[] NOT NULL DEFAULT '{}',
  subscription_id TEXT,
  pain_point TEXT,
  company_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  onboarding_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracted_departments_user ON public.contracted_departments(user_id);
CREATE INDEX idx_contracted_departments_status ON public.contracted_departments(status) WHERE status = 'active';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracted_departments TO authenticated;
GRANT ALL ON public.contracted_departments TO service_role;

ALTER TABLE public.contracted_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own contracted departments"
  ON public.contracted_departments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own contracted departments"
  ON public.contracted_departments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own contracted departments"
  ON public.contracted_departments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own contracted departments"
  ON public.contracted_departments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all contracted departments"
  ON public.contracted_departments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER contracted_departments_updated_at
  BEFORE UPDATE ON public.contracted_departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
