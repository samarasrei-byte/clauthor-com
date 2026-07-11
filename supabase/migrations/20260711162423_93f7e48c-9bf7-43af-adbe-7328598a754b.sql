
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  lead_id UUID NULL,
  title TEXT NOT NULL,
  contact_name TEXT NULL,
  contact_email TEXT NULL,
  contact_company TEXT NULL,
  value_brl NUMERIC(12,2) NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'novo' CHECK (stage IN ('novo','qualificado','proposta','negociacao','fechado_ganho','fechado_perdido')),
  source TEXT NULL,
  notes TEXT NULL,
  expected_close_date DATE NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view deals"
ON public.deals FOR SELECT
TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Tenant members can insert deals"
ON public.deals FOR INSERT
TO authenticated
WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) AND owner_id = auth.uid());

CREATE POLICY "Tenant members can update deals"
ON public.deals FOR UPDATE
TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id))
WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Tenant members can delete deals"
ON public.deals FOR DELETE
TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE INDEX idx_deals_tenant_stage ON public.deals(tenant_id, stage, position);
CREATE INDEX idx_deals_owner ON public.deals(owner_id);
CREATE INDEX idx_deals_lead ON public.deals(lead_id) WHERE lead_id IS NOT NULL;

CREATE TRIGGER update_deals_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
