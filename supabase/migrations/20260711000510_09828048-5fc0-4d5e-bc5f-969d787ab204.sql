
CREATE TABLE public.kpi_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.kpi_events TO authenticated;
GRANT ALL ON public.kpi_events TO service_role;

ALTER TABLE public.kpi_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own kpi events"
  ON public.kpi_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own kpi events"
  ON public.kpi_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all kpi events"
  ON public.kpi_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_kpi_events_event_created ON public.kpi_events (event, created_at DESC);
CREATE INDEX idx_kpi_events_tenant_created ON public.kpi_events (tenant_id, created_at DESC);

-- Percentiles for TTFV — admin-only via has_role check inside function.
CREATE OR REPLACE FUNCTION public.get_ttfv_percentiles(_since timestamptz DEFAULT (now() - interval '30 days'))
RETURNS TABLE(
  sample_size bigint,
  p50_ms numeric,
  p75_ms numeric,
  p90_ms numeric,
  p95_ms numeric,
  avg_ms numeric,
  min_ms numeric,
  max_ms numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  RETURN QUERY
  SELECT
    count(*)::bigint,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY ((payload->>'ttfv_ms')::numeric)),
    percentile_cont(0.75) WITHIN GROUP (ORDER BY ((payload->>'ttfv_ms')::numeric)),
    percentile_cont(0.90) WITHIN GROUP (ORDER BY ((payload->>'ttfv_ms')::numeric)),
    percentile_cont(0.95) WITHIN GROUP (ORDER BY ((payload->>'ttfv_ms')::numeric)),
    avg((payload->>'ttfv_ms')::numeric),
    min((payload->>'ttfv_ms')::numeric),
    max((payload->>'ttfv_ms')::numeric)
  FROM public.kpi_events
  WHERE event = 'time_to_first_value'
    AND created_at >= _since
    AND payload ? 'ttfv_ms';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ttfv_percentiles(timestamptz) TO authenticated;

-- Daily TTFV trend for admin chart.
CREATE OR REPLACE FUNCTION public.get_ttfv_daily(_since timestamptz DEFAULT (now() - interval '30 days'))
RETURNS TABLE(day date, sample_size bigint, p50_ms numeric, p90_ms numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  RETURN QUERY
  SELECT
    date_trunc('day', created_at)::date AS day,
    count(*)::bigint,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY ((payload->>'ttfv_ms')::numeric)),
    percentile_cont(0.90) WITHIN GROUP (ORDER BY ((payload->>'ttfv_ms')::numeric))
  FROM public.kpi_events
  WHERE event = 'time_to_first_value'
    AND created_at >= _since
    AND payload ? 'ttfv_ms'
  GROUP BY 1
  ORDER BY 1 ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ttfv_daily(timestamptz) TO authenticated;

-- Wow funnel counters (started → form_submitted → output_ready → approved).
CREATE OR REPLACE FUNCTION public.get_wow_funnel(_since timestamptz DEFAULT (now() - interval '30 days'))
RETURNS TABLE(step text, unique_users bigint, events bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  RETURN QUERY
  SELECT
    ke.event AS step,
    count(DISTINCT ke.user_id)::bigint AS unique_users,
    count(*)::bigint AS events
  FROM public.kpi_events ke
  WHERE ke.event IN ('wow_started','wow_form_submitted','wow_output_ready','first_wow_approved','wow_skipped')
    AND ke.created_at >= _since
  GROUP BY ke.event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_wow_funnel(timestamptz) TO authenticated;
