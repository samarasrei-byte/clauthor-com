CREATE TABLE IF NOT EXISTS public.ambient_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('approval_backlog','low_confidence_streak','stale_agent','opportunity','risk','celebration','integration_missing')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warn','critical','success')),
  title TEXT NOT NULL,
  body TEXT,
  cta_label TEXT,
  cta_route TEXT,
  source TEXT NOT NULL DEFAULT 'ambient-scan',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acted','dismissed','expired')),
  acted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambient_signals TO authenticated;
GRANT ALL ON public.ambient_signals TO service_role;

ALTER TABLE public.ambient_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members read ambient_signals" ON public.ambient_signals FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "tenant members update ambient_signals" ON public.ambient_signals FOR UPDATE TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "tenant members insert ambient_signals" ON public.ambient_signals FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE INDEX IF NOT EXISTS ambient_signals_tenant_status_idx ON public.ambient_signals(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS ambient_signals_kind_idx ON public.ambient_signals(tenant_id, kind);

CREATE OR REPLACE FUNCTION public.tg_ambient_signals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_ambient_signals_updated_at ON public.ambient_signals;
CREATE TRIGGER trg_ambient_signals_updated_at BEFORE UPDATE ON public.ambient_signals FOR EACH ROW EXECUTE FUNCTION public.tg_ambient_signals_updated_at();