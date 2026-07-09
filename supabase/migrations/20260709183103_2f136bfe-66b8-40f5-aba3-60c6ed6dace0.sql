-- 1) Table
CREATE TABLE public.customer_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('agent','squad','department')),
  subject_ref TEXT NOT NULL,
  subject_name TEXT,
  current_step TEXT NOT NULL DEFAULT 'welcome',
  steps_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','skipped')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject_type, subject_ref)
);

-- 2) Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_onboarding TO authenticated;
GRANT ALL ON public.customer_onboarding TO service_role;

-- 3) RLS
ALTER TABLE public.customer_onboarding ENABLE ROW LEVEL SECURITY;

-- 4) Policies
CREATE POLICY "Users manage own onboarding"
  ON public.customer_onboarding
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all onboarding"
  ON public.customer_onboarding
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5) Indexes
CREATE INDEX idx_customer_onboarding_user ON public.customer_onboarding(user_id);
CREATE INDEX idx_customer_onboarding_status ON public.customer_onboarding(status) WHERE status = 'in_progress';
CREATE INDEX idx_customer_onboarding_tenant ON public.customer_onboarding(tenant_id) WHERE tenant_id IS NOT NULL;

-- 6) updated_at trigger (reuses existing helper)
CREATE TRIGGER trg_customer_onboarding_updated_at
  BEFORE UPDATE ON public.customer_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();