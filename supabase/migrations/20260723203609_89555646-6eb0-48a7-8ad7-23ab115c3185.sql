
-- 1. hunter_leads: colunas para dedupe e trilha
ALTER TABLE public.hunter_leads
  ADD COLUMN IF NOT EXISTS linkedin_urn TEXT,
  ADD COLUMN IF NOT EXISTS sent_to_crm JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS liked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS commented_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS hunter_leads_campaign_urn_uniq
  ON public.hunter_leads(campaign_id, linkedin_urn)
  WHERE linkedin_urn IS NOT NULL;

-- 2. hunter_action_jobs
CREATE TABLE IF NOT EXISTS public.hunter_action_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID,
  lead_id UUID REFERENCES public.hunter_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.hunter_campaigns(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('like','comment','crm_push')),
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','success','failed','skipped_duplicate')),
  attempt INT NOT NULL DEFAULT 1,
  max_attempts INT NOT NULL DEFAULT 3,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hunter_action_jobs TO authenticated;
GRANT ALL ON public.hunter_action_jobs TO service_role;

ALTER TABLE public.hunter_action_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own hunter_action_jobs"
  ON public.hunter_action_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own hunter_action_jobs"
  ON public.hunter_action_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own hunter_action_jobs"
  ON public.hunter_action_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all hunter_action_jobs"
  ON public.hunter_action_jobs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_hunter_action_jobs_user_created
  ON public.hunter_action_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hunter_action_jobs_lead
  ON public.hunter_action_jobs(lead_id);
CREATE INDEX IF NOT EXISTS idx_hunter_action_jobs_status_retry
  ON public.hunter_action_jobs(status, next_retry_at)
  WHERE status = 'queued';

CREATE TRIGGER update_hunter_action_jobs_updated_at
  BEFORE UPDATE ON public.hunter_action_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.hunter_action_jobs;
ALTER TABLE public.hunter_action_jobs REPLICA IDENTITY FULL;
