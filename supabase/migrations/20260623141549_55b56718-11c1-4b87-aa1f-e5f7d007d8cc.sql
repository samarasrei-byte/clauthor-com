
-- =========================================
-- OUTCOME-BASED PRICING — Phase 1
-- =========================================

-- Enum for outcome types
DO $$ BEGIN
  CREATE TYPE public.outcome_type AS ENUM (
    'lead_qualified',
    'meeting_booked',
    'contract_signed',
    'sale_closed',
    'document_generated',
    'task_completed',
    'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.outcome_status AS ENUM (
    'pending',
    'billed',
    'paid',
    'disputed',
    'voided'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================
-- TABLE: outcome_pricing_rules
-- =========================================
CREATE TABLE IF NOT EXISTS public.outcome_pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outcome_type public.outcome_type NOT NULL,
  agent_slug TEXT,
  price_brl NUMERIC(12,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  min_charge_brl NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_charge_brl NUMERIC(12,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, outcome_type, agent_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outcome_pricing_rules TO authenticated;
GRANT ALL ON public.outcome_pricing_rules TO service_role;

ALTER TABLE public.outcome_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view pricing rules"
  ON public.outcome_pricing_rules FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can insert pricing rules"
  ON public.outcome_pricing_rules FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can update pricing rules"
  ON public.outcome_pricing_rules FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete pricing rules"
  ON public.outcome_pricing_rules FOR DELETE TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER outcome_pricing_rules_updated_at
  BEFORE UPDATE ON public.outcome_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_outcome_pricing_rules_tenant ON public.outcome_pricing_rules(tenant_id);
CREATE INDEX idx_outcome_pricing_rules_lookup ON public.outcome_pricing_rules(tenant_id, outcome_type, is_active);

-- =========================================
-- TABLE: outcome_events
-- =========================================
CREATE TABLE IF NOT EXISTS public.outcome_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  agent_slug TEXT,
  outcome_type public.outcome_type NOT NULL,
  reference_id TEXT,
  value_brl NUMERIC(12,2) NOT NULL DEFAULT 0,
  computed_charge_brl NUMERIC(12,2) NOT NULL DEFAULT 0,
  pricing_rule_id UUID REFERENCES public.outcome_pricing_rules(id) ON DELETE SET NULL,
  status public.outcome_status NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  billed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outcome_events TO authenticated;
GRANT ALL ON public.outcome_events TO service_role;

ALTER TABLE public.outcome_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view outcome events"
  ON public.outcome_events FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Tenant members can insert outcome events"
  ON public.outcome_events FOR INSERT TO authenticated
  WITH CHECK (
    public.is_tenant_member(auth.uid(), tenant_id)
    AND user_id = auth.uid()
  );

CREATE POLICY "Tenant admins can update outcome events"
  ON public.outcome_events FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete outcome events"
  ON public.outcome_events FOR DELETE TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER outcome_events_updated_at
  BEFORE UPDATE ON public.outcome_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_outcome_events_tenant ON public.outcome_events(tenant_id);
CREATE INDEX idx_outcome_events_user ON public.outcome_events(user_id);
CREATE INDEX idx_outcome_events_agent ON public.outcome_events(agent_id);
CREATE INDEX idx_outcome_events_status ON public.outcome_events(tenant_id, status, created_at DESC);
CREATE INDEX idx_outcome_events_billing ON public.outcome_events(tenant_id, billed_at) WHERE status = 'pending';

-- =========================================
-- FUNCTION: compute_outcome_charge
-- Applies the active pricing rule for the tenant/outcome_type
-- =========================================
CREATE OR REPLACE FUNCTION public.compute_outcome_charge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_charge NUMERIC(12,2) := 0;
BEGIN
  -- Prefer agent-specific rule, then fallback to tenant-wide rule
  SELECT * INTO v_rule
  FROM public.outcome_pricing_rules
  WHERE tenant_id = NEW.tenant_id
    AND outcome_type = NEW.outcome_type
    AND is_active = true
    AND (agent_slug IS NULL OR agent_slug = NEW.agent_slug)
  ORDER BY (agent_slug IS NOT NULL) DESC
  LIMIT 1;

  IF v_rule.id IS NULL THEN
    NEW.computed_charge_brl := 0;
    RETURN NEW;
  END IF;

  v_charge := v_rule.price_brl + (COALESCE(NEW.value_brl, 0) * v_rule.percentage / 100.0);

  IF v_rule.min_charge_brl > 0 AND v_charge < v_rule.min_charge_brl THEN
    v_charge := v_rule.min_charge_brl;
  END IF;

  IF v_rule.max_charge_brl IS NOT NULL AND v_charge > v_rule.max_charge_brl THEN
    v_charge := v_rule.max_charge_brl;
  END IF;

  NEW.computed_charge_brl := v_charge;
  NEW.pricing_rule_id := v_rule.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER outcome_events_compute_charge
  BEFORE INSERT ON public.outcome_events
  FOR EACH ROW EXECUTE FUNCTION public.compute_outcome_charge();
