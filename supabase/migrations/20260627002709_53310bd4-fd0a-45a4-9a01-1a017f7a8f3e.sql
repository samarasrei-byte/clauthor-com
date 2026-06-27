
-- Network Effects: anonymous cross-tenant benchmarks
CREATE TABLE public.benchmark_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL CHECK (metric_key IN (
    'leads_per_week','reply_rate','meetings_booked','posts_approved',
    'approval_time_hours','time_to_first_value_seconds','revenue_attributed','tasks_completed'
  )),
  metric_value NUMERIC NOT NULL,
  period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('week', now()),
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('solo','small','medium','large','enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_benchmark_metrics_tenant ON public.benchmark_metrics(tenant_id);
CREATE INDEX idx_benchmark_metrics_key_period ON public.benchmark_metrics(metric_key, period_start DESC);
CREATE INDEX idx_benchmark_metrics_industry ON public.benchmark_metrics(industry, metric_key);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.benchmark_metrics TO authenticated;
GRANT ALL ON public.benchmark_metrics TO service_role;

ALTER TABLE public.benchmark_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members manage own benchmarks"
ON public.benchmark_metrics FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = benchmark_metrics.tenant_id AND tm.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = benchmark_metrics.tenant_id AND tm.user_id = auth.uid())
);

-- Anonymized aggregated view (security_invoker so caller's RLS does not block aggregation)
CREATE OR REPLACE FUNCTION public.get_benchmark_percentiles(
  _metric_key TEXT,
  _industry TEXT DEFAULT NULL,
  _company_size TEXT DEFAULT NULL
)
RETURNS TABLE (
  metric_key TEXT,
  sample_size BIGINT,
  p25 NUMERIC,
  p50 NUMERIC,
  p75 NUMERIC,
  p90 NUMERIC,
  avg_value NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _metric_key,
    COUNT(DISTINCT tenant_id) AS sample_size,
    percentile_cont(0.25) WITHIN GROUP (ORDER BY metric_value) AS p25,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY metric_value) AS p50,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY metric_value) AS p75,
    percentile_cont(0.90) WITHIN GROUP (ORDER BY metric_value) AS p90,
    AVG(metric_value) AS avg_value
  FROM public.benchmark_metrics
  WHERE metric_key = _metric_key
    AND period_start >= now() - INTERVAL '90 days'
    AND (_industry IS NULL OR industry = _industry)
    AND (_company_size IS NULL OR company_size = _company_size)
  HAVING COUNT(DISTINCT tenant_id) >= 5;  -- k-anonymity threshold
$$;

REVOKE EXECUTE ON FUNCTION public.get_benchmark_percentiles(TEXT,TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_benchmark_percentiles(TEXT,TEXT,TEXT) TO authenticated;
