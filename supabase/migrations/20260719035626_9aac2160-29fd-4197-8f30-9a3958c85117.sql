CREATE OR REPLACE FUNCTION public.get_ttfv_percentiles(_since timestamp with time zone DEFAULT (now() - '30 days'::interval))
 RETURNS TABLE(sample_size bigint, p50_ms numeric, p75_ms numeric, p90_ms numeric, p95_ms numeric, avg_ms numeric, min_ms numeric, max_ms numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  RETURN QUERY
  SELECT
    count(*)::bigint,
    (percentile_cont(0.50) WITHIN GROUP (ORDER BY ((payload->>'ttfv_ms')::numeric)))::numeric,
    (percentile_cont(0.75) WITHIN GROUP (ORDER BY ((payload->>'ttfv_ms')::numeric)))::numeric,
    (percentile_cont(0.90) WITHIN GROUP (ORDER BY ((payload->>'ttfv_ms')::numeric)))::numeric,
    (percentile_cont(0.95) WITHIN GROUP (ORDER BY ((payload->>'ttfv_ms')::numeric)))::numeric,
    (avg((payload->>'ttfv_ms')::numeric))::numeric,
    (min((payload->>'ttfv_ms')::numeric))::numeric,
    (max((payload->>'ttfv_ms')::numeric))::numeric
  FROM public.kpi_events
  WHERE event = 'time_to_first_value'
    AND created_at >= _since
    AND payload ? 'ttfv_ms';
END;
$function$;