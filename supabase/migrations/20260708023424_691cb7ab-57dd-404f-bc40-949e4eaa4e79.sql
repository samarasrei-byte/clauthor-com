
-- 1. Tier quotas reference table
CREATE TABLE public.agent_tier_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL UNIQUE,
  monthly_quota integer NOT NULL,
  overage_price_per_1k_usd numeric(10,2) NOT NULL DEFAULT 0,
  overage_price_per_1k_brl numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.agent_tier_quotas TO authenticated, anon;
GRANT ALL ON public.agent_tier_quotas TO service_role;
ALTER TABLE public.agent_tier_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tier_quotas_readable" ON public.agent_tier_quotas
  FOR SELECT USING (true);
CREATE POLICY "tier_quotas_service_write" ON public.agent_tier_quotas
  FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.agent_tier_quotas (tier, monthly_quota, overage_price_per_1k_usd, overage_price_per_1k_brl) VALUES
  ('starter',   500, 15.00,  75.00),
  ('entry',    1500, 20.00, 100.00),
  ('mid',      3000, 25.00, 125.00),
  ('high',     5000, 30.00, 150.00),
  ('hunter',   3000, 40.00, 200.00),
  ('premium',  8000, 35.00, 175.00);

-- 2. Monthly usage table (tenant + agent scoped)
CREATE TABLE public.agent_usage_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  agent_slug text NOT NULL,
  tier text NOT NULL,
  period_start date NOT NULL,
  actions_count integer NOT NULL DEFAULT 0,
  quota integer NOT NULL,
  overage_actions integer NOT NULL DEFAULT 0,
  overage_charge_usd numeric(12,2) NOT NULL DEFAULT 0,
  last_action_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, agent_slug, period_start)
);

CREATE INDEX idx_agent_usage_tenant_period ON public.agent_usage_monthly (tenant_id, period_start DESC);
CREATE INDEX idx_agent_usage_agent ON public.agent_usage_monthly (agent_slug, period_start DESC);

GRANT SELECT ON public.agent_usage_monthly TO authenticated;
GRANT ALL ON public.agent_usage_monthly TO service_role;
ALTER TABLE public.agent_usage_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_tenant_read" ON public.agent_usage_monthly
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "usage_service_write" ON public.agent_usage_monthly
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_agent_usage_monthly_updated_at
  BEFORE UPDATE ON public.agent_usage_monthly
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Atomic RPC: increment usage and return quota status
CREATE OR REPLACE FUNCTION public.increment_agent_usage(
  _tenant_id uuid,
  _agent_slug text,
  _tier text,
  _actions integer DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period date := date_trunc('month', now())::date;
  v_quota integer;
  v_overage_price numeric;
  v_row public.agent_usage_monthly;
  v_new_count integer;
  v_new_overage integer;
  v_new_charge numeric(12,2);
  v_status text;
  v_pct numeric;
BEGIN
  SELECT monthly_quota, overage_price_per_1k_usd
    INTO v_quota, v_overage_price
  FROM public.agent_tier_quotas
  WHERE tier = _tier;

  IF v_quota IS NULL THEN
    RAISE EXCEPTION 'Unknown tier: %', _tier;
  END IF;

  INSERT INTO public.agent_usage_monthly
    (tenant_id, agent_slug, tier, period_start, actions_count, quota, last_action_at)
  VALUES
    (_tenant_id, _agent_slug, _tier, v_period, _actions, v_quota, now())
  ON CONFLICT (tenant_id, agent_slug, period_start) DO UPDATE
    SET actions_count = agent_usage_monthly.actions_count + _actions,
        tier          = EXCLUDED.tier,
        quota         = EXCLUDED.quota,
        last_action_at = now()
  RETURNING * INTO v_row;

  v_new_count   := v_row.actions_count;
  v_new_overage := GREATEST(0, v_new_count - v_quota);
  v_new_charge  := (v_new_overage::numeric / 1000.0) * v_overage_price;

  UPDATE public.agent_usage_monthly
    SET overage_actions    = v_new_overage,
        overage_charge_usd = v_new_charge
  WHERE id = v_row.id;

  v_pct := (v_new_count::numeric / NULLIF(v_quota,0)) * 100;
  v_status := CASE
    WHEN v_new_count >= v_quota * 1.2 THEN 'hard_cap'
    WHEN v_new_count > v_quota        THEN 'over_quota'
    WHEN v_pct >= 80                  THEN 'approaching'
    ELSE 'within_quota'
  END;

  RETURN jsonb_build_object(
    'status',             v_status,
    'tier',               _tier,
    'quota',              v_quota,
    'actions_count',      v_new_count,
    'remaining',          GREATEST(0, v_quota - v_new_count),
    'overage_actions',    v_new_overage,
    'overage_charge_usd', v_new_charge,
    'usage_pct',          round(v_pct, 1),
    'period_start',       v_period
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_agent_usage(uuid, text, text, integer)
  TO authenticated, service_role;
