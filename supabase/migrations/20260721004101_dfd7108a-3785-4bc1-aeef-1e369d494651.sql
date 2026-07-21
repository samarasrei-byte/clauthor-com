-- Revoke PUBLIC EXECUTE on internal trigger functions (called by DB triggers, not clients)
REVOKE EXECUTE ON FUNCTION public.mark_first_execution_done() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_thor_token_touchpoint() FROM PUBLIC, anon, authenticated;

-- Revoke PUBLIC EXECUTE on admin/KPI functions (they gate with has_role internally,
-- but exposing to PUBLIC/anon is unnecessary surface area). Keep authenticated.
REVOKE EXECUTE ON FUNCTION public.get_ttfv_daily(timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_ttfv_percentiles(timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_wow_funnel(timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_wow_variant_significance(timestamptz) FROM PUBLIC, anon;

-- check_video_quota is called from client for authenticated users; drop anon.
REVOKE EXECUTE ON FUNCTION public.check_video_quota(uuid) FROM PUBLIC, anon;
