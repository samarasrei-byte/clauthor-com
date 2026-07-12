REVOKE EXECUTE ON FUNCTION public.get_ttfv_percentiles(timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_ttfv_daily(timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_wow_funnel(timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_wow_variant_significance(timestamptz) FROM anon;

REVOKE SELECT ON public.demo_runs FROM anon;

DROP POLICY IF EXISTS "Public can read demo runs" ON public.demo_runs;

CREATE POLICY "Admins can read demo runs"
  ON public.demo_runs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));