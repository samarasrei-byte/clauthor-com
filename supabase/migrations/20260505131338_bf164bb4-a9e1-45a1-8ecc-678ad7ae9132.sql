
REVOKE EXECUTE ON FUNCTION public.verify_api_key(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.log_api_call(uuid, text, int) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.verify_api_key(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_api_call(uuid, text, int) TO service_role;
