
-- Fix agent_credentials_safe: ALWAYS mask credential_value regardless of is_secret
DROP VIEW IF EXISTS public.agent_credentials_safe;
CREATE VIEW public.agent_credentials_safe
  WITH (security_invoker = true)
AS
SELECT
  id,
  agent_id,
  user_id,
  integration_name,
  credential_key,
  '••••••••'::text AS credential_value,
  is_secret,
  expires_at,
  last_accessed_at,
  access_count,
  created_at,
  updated_at
FROM public.agent_credentials;

GRANT SELECT ON public.agent_credentials_safe TO authenticated;
