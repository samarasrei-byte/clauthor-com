
REVOKE EXECUTE ON FUNCTION public.increment_agent_usage(uuid, text, text, integer) FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.increment_agent_usage(uuid, text, text, integer) TO service_role;
