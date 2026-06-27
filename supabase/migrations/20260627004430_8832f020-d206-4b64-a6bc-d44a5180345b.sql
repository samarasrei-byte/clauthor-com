
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  clicks INTEGER NOT NULL DEFAULT 0,
  signups INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_referrals_tenant ON public.referrals(tenant_id);
CREATE INDEX idx_referrals_code ON public.referrals(code);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members manage their referrals"
ON public.referrals FOR ALL
USING (tenant_id = public.get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE TABLE public.referral_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('click','signup','conversion')),
  visitor_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_referral_events_ref ON public.referral_events(referral_id);

GRANT SELECT, INSERT ON public.referral_events TO authenticated;
GRANT ALL ON public.referral_events TO service_role;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members read their referral events"
ON public.referral_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.referrals r
    WHERE r.id = referral_events.referral_id
      AND r.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE TRIGGER trg_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
